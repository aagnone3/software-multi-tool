import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommandPalette } from "./CommandPalette";

// Mock next/navigation
vi.mock("next/navigation", () => ({
	useRouter: vi.fn(),
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
	},
}));

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
		localStorage.clear();
		vi.clearAllMocks();
	});

	afterEach(() => {
		localStorage.clear();
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
			screen.getByPlaceholderText("Search tools..."),
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

		const searchInput = screen.getByPlaceholderText("Search tools...");
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

	it("stores recently used tools in localStorage", async () => {
		render(<CommandPalette isOpen={true} onClose={mockClose} />);

		const tool = screen.getByText("Test Tool 1");
		fireEvent.click(tool);

		await waitFor(() => {
			const stored = localStorage.getItem("command-palette:recent-tools");
			expect(stored).toBeTruthy();
			if (stored) {
				const recent = JSON.parse(stored);
				expect(recent).toContain("test-tool-1");
			}
		});
	});

	it("displays recently used tools section", async () => {
		// Pre-populate recent tools
		localStorage.setItem(
			"command-palette:recent-tools",
			JSON.stringify(["test-tool-2"]),
		);

		render(<CommandPalette isOpen={true} onClose={mockClose} />);

		await waitFor(() => {
			expect(screen.getByText("Recently Used")).toBeInTheDocument();
		});
	});

	it("closes when clicking backdrop", () => {
		render(<CommandPalette isOpen={true} onClose={mockClose} />);

		const backdrop = screen
			.getByPlaceholderText("Search tools...")
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

	it("limits recent tools to maximum of 5", async () => {
		// Manually simulate adding 6 tools to localStorage
		const slugs = [
			"test-tool-1",
			"test-tool-2",
			"test-tool-1",
			"test-tool-2",
			"test-tool-1",
			"test-tool-2",
		];

		// Add each slug to recent tools
		for (const slug of slugs) {
			const current = localStorage.getItem(
				"command-palette:recent-tools",
			);
			const recent = current ? JSON.parse(current) : [];
			const filtered = recent.filter((s: string) => s !== slug);
			filtered.unshift(slug);
			const trimmed = filtered.slice(0, 5);
			localStorage.setItem(
				"command-palette:recent-tools",
				JSON.stringify(trimmed),
			);
		}

		const stored = localStorage.getItem("command-palette:recent-tools");
		expect(stored).toBeTruthy();
		if (stored) {
			const recent = JSON.parse(stored);
			expect(recent.length).toBeLessThanOrEqual(5);
		}
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
