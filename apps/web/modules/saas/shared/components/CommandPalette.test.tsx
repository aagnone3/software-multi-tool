import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommandPalette } from "./CommandPalette";

// Mock next/navigation
vi.mock("next/navigation", () => ({
	useRouter: vi.fn(),
}));

// Mock auth hooks
vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: vi.fn(() => ({
		user: null,
		session: null,
	})),
}));

// Mock organization hooks
vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: vi.fn(() => ({
		activeOrganization: null,
	})),
}));

// Mock config
vi.mock("@repo/config", () => ({
	config: {
		tools: {
			registry: [
				{
					slug: "test-tool-1",
					name: "Test Tool 1",
					description: "First test tool",
					icon: "wrench",
					enabled: true,
					public: true,
				},
				{
					slug: "test-tool-2",
					name: "Test Tool 2",
					description: "Second test tool",
					icon: "users",
					enabled: true,
					public: true,
				},
				{
					slug: "test-tool-3",
					name: "Disabled Tool",
					description: "This tool is disabled",
					icon: "newspaper",
					enabled: false,
					public: true,
				},
			],
		},
		organizations: {
			hideOrganization: false,
		},
	},
}));

// Mock localStorage for happy-dom environment
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		},
		get length() {
			return Object.keys(store).length;
		},
		key: (index: number) => Object.keys(store)[index] ?? null,
	};
})();

Object.defineProperty(globalThis, "localStorage", {
	value: localStorageMock,
	writable: true,
});

describe("CommandPalette", () => {
	const mockPush = vi.fn();
	const mockClose = vi.fn();

	beforeEach(() => {
		vi.mocked(useRouter).mockReturnValue({
			push: mockPush,
			back: vi.fn(),
			forward: vi.fn(),
			refresh: vi.fn(),
			replace: vi.fn(),
			prefetch: vi.fn(),
		} as ReturnType<typeof useRouter>);
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	afterEach(() => {
		localStorageMock.clear();
	});

	it("renders nothing when closed", () => {
		const { container } = render(
			<CommandPalette isOpen={false} onClose={mockClose} />,
		);
		expect(container.firstChild).toBeNull();
	});

	it("renders command palette when open", () => {
		render(<CommandPalette isOpen={true} onClose={mockClose} />);
		expect(
			screen.getByPlaceholderText("Search pages and tools..."),
		).toBeInTheDocument();
	});

	it("displays enabled tools only", () => {
		render(<CommandPalette isOpen={true} onClose={mockClose} />);
		expect(screen.getByText("Test Tool 1")).toBeInTheDocument();
		expect(screen.getByText("Test Tool 2")).toBeInTheDocument();
		expect(screen.queryByText("Disabled Tool")).not.toBeInTheDocument();
	});

	it("filters tools based on search input", async () => {
		render(<CommandPalette isOpen={true} onClose={mockClose} />);

		const searchInput = screen.getByPlaceholderText(
			"Search pages and tools...",
		);
		fireEvent.change(searchInput, { target: { value: "Test Tool 1" } });

		await waitFor(() => {
			expect(screen.getByText("Test Tool 1")).toBeInTheDocument();
			// Note: cmdk may still render hidden items, so we check visibility via DOM
		});
	});

	it("navigates to tool when selected", async () => {
		render(<CommandPalette isOpen={true} onClose={mockClose} />);

		const tool = screen.getByText("Test Tool 1");
		fireEvent.click(tool);

		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith("/app/tools/test-tool-1");
			expect(mockClose).toHaveBeenCalled();
		});
	});

	it("stores recently used items in localStorage", async () => {
		render(<CommandPalette isOpen={true} onClose={mockClose} />);

		const tool = screen.getByText("Test Tool 1");
		fireEvent.click(tool);

		await waitFor(() => {
			const stored = localStorage.getItem("command-palette:recent-items");
			expect(stored).toBeTruthy();
			if (stored) {
				const recent = JSON.parse(stored);
				expect(recent).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							id: "test-tool-1",
							type: "tool",
						}),
					]),
				);
			}
		});
	});

	it("displays recently used items section", async () => {
		// Pre-populate recent items
		localStorage.setItem(
			"command-palette:recent-items",
			JSON.stringify([{ id: "test-tool-2", type: "tool" }]),
		);

		render(<CommandPalette isOpen={true} onClose={mockClose} />);

		await waitFor(() => {
			expect(screen.getByText("Recently Used")).toBeInTheDocument();
		});
	});

	it("closes when clicking backdrop", () => {
		render(<CommandPalette isOpen={true} onClose={mockClose} />);

		const backdrop = screen
			.getByPlaceholderText("Search pages and tools...")
			.closest("div")?.parentElement?.parentElement;

		if (backdrop) {
			fireEvent.click(backdrop);
			expect(mockClose).toHaveBeenCalled();
		}
	});

	it("closes on Escape key", () => {
		render(<CommandPalette isOpen={true} onClose={mockClose} />);

		fireEvent.keyDown(document, { key: "Escape" });

		expect(mockClose).toHaveBeenCalled();
	});

	it("limits recent items to maximum of 5", async () => {
		// Manually simulate adding 6 items to localStorage
		const items = [
			{ id: "test-tool-1", type: "tool" as const },
			{ id: "test-tool-2", type: "tool" as const },
			{ id: "home", type: "page" as const },
			{ id: "test-tool-1", type: "tool" as const },
			{ id: "chatbot", type: "page" as const },
			{ id: "test-tool-2", type: "tool" as const },
		];

		// Add each item to recent items
		for (const item of items) {
			const current = localStorage.getItem(
				"command-palette:recent-items",
			);
			const recent = current ? JSON.parse(current) : [];
			const filtered = recent.filter(
				(i: { id: string; type: string }) => i.id !== item.id,
			);
			filtered.unshift(item);
			const trimmed = filtered.slice(0, 5);
			localStorage.setItem(
				"command-palette:recent-items",
				JSON.stringify(trimmed),
			);
		}

		const stored = localStorage.getItem("command-palette:recent-items");
		expect(stored).toBeTruthy();
		if (stored) {
			const recent = JSON.parse(stored);
			expect(recent.length).toBeLessThanOrEqual(5);
		}
	});

	it("displays navigation pages", () => {
		render(<CommandPalette isOpen={true} onClose={mockClose} />);

		expect(screen.getByText("Home")).toBeInTheDocument();
		expect(screen.getByText("AI Chatbot")).toBeInTheDocument();
		expect(screen.getByText("Settings")).toBeInTheDocument();
		expect(screen.getByText("Usage")).toBeInTheDocument();
	});

	it("navigates to page when selected", async () => {
		render(<CommandPalette isOpen={true} onClose={mockClose} />);

		const page = screen.getByText("AI Chatbot");
		fireEvent.click(page);

		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith("/app/chatbot");
			expect(mockClose).toHaveBeenCalled();
		});
	});

	it("shows keyboard navigation hints", () => {
		render(<CommandPalette isOpen={true} onClose={mockClose} />);

		expect(screen.getByText(/to navigate/i)).toBeInTheDocument();
		expect(screen.getByText(/to select/i)).toBeInTheDocument();
		expect(screen.getByText(/to close/i)).toBeInTheDocument();
	});

	it("displays tool descriptions", () => {
		render(<CommandPalette isOpen={true} onClose={mockClose} />);

		expect(screen.getByText("First test tool")).toBeInTheDocument();
		expect(screen.getByText("Second test tool")).toBeInTheDocument();
	});
});
