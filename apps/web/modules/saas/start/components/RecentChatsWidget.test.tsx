import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecentChatsWidget } from "./RecentChatsWidget";

vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => ({ activeOrganization: null }),
}));

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		ai: {
			chats: {
				list: {
					queryOptions: vi.fn(() => ({
						queryKey: ["ai.chats.list"],
						queryFn: vi.fn(),
					})),
				},
			},
		},
	},
}));

const mockUseQuery = vi.fn();
vi.mock("@tanstack/react-query", () => ({
	useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

describe("RecentChatsWidget", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("shows loading state", () => {
		mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });
		render(<RecentChatsWidget />);
		expect(screen.getByText("Loading...")).toBeDefined();
	});

	it("shows empty state when no chats", () => {
		mockUseQuery.mockReturnValue({ data: { chats: [] }, isLoading: false });
		render(<RecentChatsWidget />);
		expect(screen.getByText("No chats yet")).toBeDefined();
	});

	it("renders chat list", () => {
		const now = new Date();
		mockUseQuery.mockReturnValue({
			data: {
				chats: [
					{
						id: "1",
						title: "My first chat",
						createdAt: now.toISOString(),
						messages: [],
					},
					{
						id: "2",
						title: "Second chat",
						createdAt: new Date(
							now.getTime() - 60000,
						).toISOString(),
						messages: [],
					},
				],
			},
			isLoading: false,
		});
		render(<RecentChatsWidget />);
		expect(screen.getByText("My first chat")).toBeDefined();
		expect(screen.getByText("Second chat")).toBeDefined();
	});

	it("respects maxChats limit", () => {
		const now = new Date();
		const chats = Array.from({ length: 6 }, (_, i) => ({
			id: String(i),
			title: `Chat ${i}`,
			createdAt: new Date(now.getTime() - i * 60000).toISOString(),
			messages: [],
		}));
		mockUseQuery.mockReturnValue({ data: { chats }, isLoading: false });
		render(<RecentChatsWidget maxChats={2} />);
		expect(screen.getByText("Chat 0")).toBeDefined();
		expect(screen.getByText("Chat 1")).toBeDefined();
		expect(screen.queryByText("Chat 2")).toBeNull();
	});

	it("uses message content as title when chat title is missing", () => {
		const now = new Date();
		mockUseQuery.mockReturnValue({
			data: {
				chats: [
					{
						id: "1",
						title: null,
						createdAt: now.toISOString(),
						messages: [{ content: "Hello there how are you" }],
					},
				],
			},
			isLoading: false,
		});
		render(<RecentChatsWidget />);
		expect(screen.getByText("Hello there how are you")).toBeDefined();
	});
});

describe("RecentChatsWidget error state", () => {
	it("shows error state when query fails", () => {
		mockUseQuery.mockReturnValue({
			data: undefined,
			isLoading: false,
			isError: true,
		});
		render(<RecentChatsWidget />);
		expect(screen.getByText("Failed to load chats")).toBeDefined();
	});
});
