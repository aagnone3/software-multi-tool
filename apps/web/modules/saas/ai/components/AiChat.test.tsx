"use client";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mocks
const useQueryMock = vi.hoisted(() => vi.fn());
const useMutationMock = vi.hoisted(() => vi.fn());
const useQueryClientMock = vi.hoisted(() =>
	vi.fn(() => ({
		invalidateQueries: vi.fn(),
		setQueryData: vi.fn(),
	})),
);
const useQueryStateMock = vi.hoisted(() => vi.fn());
const useChatMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", () => ({
	useQuery: useQueryMock,
	useMutation: useMutationMock,
	useQueryClient: useQueryClientMock,
	skipToken: "skipToken",
}));

vi.mock("nuqs", () => ({
	useQueryState: useQueryStateMock,
}));

vi.mock("@ai-sdk/react", () => ({
	useChat: useChatMock,
}));

vi.mock("@orpc/client", () => ({
	eventIteratorToUnproxiedDataStream: vi.fn(),
}));

vi.mock("@shared/lib/orpc-client", () => ({
	orpcClient: {
		ai: {
			chats: {
				messages: {
					add: vi.fn(),
				},
			},
		},
	},
}));

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		ai: {
			chats: {
				list: {
					queryOptions: vi.fn(() => ({
						queryKey: ["ai", "chats", "list"],
					})),
					queryKey: vi.fn(() => ["ai", "chats", "list"]),
				},
				find: {
					queryOptions: vi.fn(() => ({
						queryKey: ["ai", "chats", "find"],
					})),
					queryKey: vi.fn(() => ["ai", "chats", "find"]),
				},
				create: {
					mutationOptions: vi.fn(() => ({})),
				},
			},
		},
	},
}));

vi.mock("sonner", () => ({
	toast: {
		error: toastErrorMock,
	},
}));

vi.mock("@saas/shared/components/SidebarContentLayout", () => ({
	SidebarContentLayout: ({
		children,
		sidebar,
	}: {
		children: React.ReactNode;
		sidebar: React.ReactNode;
	}) => (
		<div>
			<div data-testid="sidebar">{sidebar}</div>
			<div data-testid="content">{children}</div>
		</div>
	),
}));

import { AiChat } from "./AiChat";

const defaultMutationResult = {
	mutateAsync: vi.fn().mockResolvedValue({ chat: { id: "chat-new" } }),
	isPending: false,
};

const defaultChatResult = {
	messages: [],
	setMessages: vi.fn(),
	status: "idle",
	sendMessage: vi.fn(),
};

beforeEach(() => {
	vi.clearAllMocks();
	useQueryStateMock.mockReturnValue(["chat-1", vi.fn()]);
	useMutationMock.mockReturnValue(defaultMutationResult);
	useChatMock.mockReturnValue(defaultChatResult);

	// Default: chats loaded, currentChat loaded
	useQueryMock.mockImplementation((opts: { queryKey?: unknown[] }) => {
		const key = JSON.stringify(opts?.queryKey);
		if (key?.includes("find")) {
			return {
				data: {
					chat: {
						id: "chat-1",
						messages: [],
						title: "Test Chat",
						createdAt: new Date().toISOString(),
					},
				},
				status: "success",
			};
		}
		return {
			data: {
				chats: [
					{
						id: "chat-1",
						title: "Test Chat",
						createdAt: new Date().toISOString(),
						messages: [],
					},
				],
			},
			status: "success",
		};
	});
});

describe("AiChat", () => {
	it("renders the chat textarea and send button", () => {
		render(<AiChat />);
		expect(
			screen.getByPlaceholderText("Chat with your AI..."),
		).toBeDefined();
		expect(screen.getByRole("button", { name: /send/i })).toBeDefined();
	});

	it("textarea has accessible aria-label", () => {
		render(<AiChat />);
		const textarea = screen.getByRole("textbox", {
			name: /chat message input/i,
		});
		expect(textarea).toBeDefined();
	});

	it("active chat button has aria-current set", () => {
		render(<AiChat />);
		const activeChat = screen.getByRole("button", { name: /test chat/i });
		expect(activeChat.getAttribute("aria-current")).toBe("true");
	});

	it("renders New chat button in sidebar", () => {
		render(<AiChat />);
		expect(screen.getByRole("button", { name: /new chat/i })).toBeDefined();
	});

	it("renders existing chat in sidebar", () => {
		render(<AiChat />);
		expect(screen.getByText("Test Chat")).toBeDefined();
	});

	it("renders messages from useChat", () => {
		useChatMock.mockReturnValue({
			...defaultChatResult,
			messages: [
				{ role: "user", parts: [{ type: "text", text: "Hello" }] },
				{
					role: "assistant",
					parts: [{ type: "text", text: "Hi there" }],
				},
			],
		});
		render(<AiChat />);
		expect(screen.getByText("Hello")).toBeDefined();
		expect(screen.getByText("Hi there")).toBeDefined();
	});

	it("shows streaming indicator when status is streaming", () => {
		useChatMock.mockReturnValue({
			...defaultChatResult,
			status: "streaming",
		});
		render(<AiChat />);
		// The EllipsisIcon should be present in streaming state
		const content = screen.getByTestId("content");
		expect(content.innerHTML).toContain("animate-pulse");
	});

	it("disables textarea and send button when no chat", () => {
		useQueryStateMock.mockReturnValue([null, vi.fn()]);
		useQueryMock.mockReturnValue({
			data: { chats: [] },
			status: "success",
		});
		render(<AiChat />);
		const textarea = screen.getByPlaceholderText("Chat with your AI...");
		expect(textarea.hasAttribute("disabled")).toBe(true);
	});

	it("sends message on form submit", async () => {
		const sendMessageMock = vi.fn();
		useChatMock.mockReturnValue({
			...defaultChatResult,
			sendMessage: sendMessageMock,
		});
		const user = userEvent.setup({ delay: null });

		render(<AiChat />);
		const textarea = screen.getByPlaceholderText("Chat with your AI...");
		await user.type(textarea, "Hello AI");
		await user.click(screen.getByRole("button", { name: /send/i }));

		await waitFor(() => {
			expect(sendMessageMock).toHaveBeenCalledWith({ text: "Hello AI" });
		});
	});

	it("shows error toast when send fails", async () => {
		const sendMessageMock = vi.fn().mockRejectedValue(new Error("fail"));
		useChatMock.mockReturnValue({
			...defaultChatResult,
			sendMessage: sendMessageMock,
		});
		const user = userEvent.setup({ delay: null });

		render(<AiChat />);
		const textarea = screen.getByPlaceholderText("Chat with your AI...");
		await user.type(textarea, "fail msg");
		await user.click(screen.getByRole("button", { name: /send/i }));

		await waitFor(() => {
			expect(toastErrorMock).toHaveBeenCalledWith(
				"Failed to send message",
			);
		});
	});
});
