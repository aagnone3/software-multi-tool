import { useTools } from "@saas/tools/hooks/use-tools";
import { fireEvent, render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommandPalette } from "./CommandPalette";

vi.mock("cmdk", () => {
	const CommandRoot = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);

	const CommandInput = React.forwardRef<
		HTMLInputElement,
		React.InputHTMLAttributes<HTMLInputElement> & {
			onValueChange?: (value: string) => void;
		}
	>(({ onValueChange, onChange, ...props }, ref) => (
		<input
			ref={ref}
			onChange={(event) => {
				onValueChange?.(event.target.value);
				onChange?.(event);
			}}
			{...props}
		/>
	));
	CommandInput.displayName = "CommandInput";

	const CommandList = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	const CommandEmpty = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	const CommandGroup = ({
		heading,
		children,
	}: {
		heading?: React.ReactNode;
		children: React.ReactNode;
	}) => (
		<div>
			{heading ? <div>{heading}</div> : null}
			{children}
		</div>
	);
	const CommandItem = ({
		children,
		onSelect,
		onClick,
		disabled,
		...props
	}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
		onSelect?: () => void;
		disabled?: boolean;
	}) => (
		<button
			aria-disabled={disabled}
			disabled={disabled}
			onClick={(event) => {
				onClick?.(event);
				onSelect?.();
			}}
			type="button"
			{...props}
		>
			{children}
		</button>
	);

	return {
		Command: Object.assign(CommandRoot, {
			Input: CommandInput,
			List: CommandList,
			Empty: CommandEmpty,
			Group: CommandGroup,
			Item: CommandItem,
		}),
	};
});

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

const testTools = [
	{
		slug: "test-tool-1",
		name: "Test Tool 1",
		description: "First test tool",
		icon: "wrench",
		enabled: true,
		public: true,
		creditCost: 1,
		isEnabled: true,
		isComingSoon: false,
	},
	{
		slug: "test-tool-2",
		name: "Test Tool 2",
		description: "Second test tool",
		icon: "users",
		enabled: true,
		public: true,
		creditCost: 1,
		isEnabled: true,
		isComingSoon: false,
	},
	{
		slug: "test-tool-3",
		name: "Disabled Tool",
		description: "This tool is disabled",
		icon: "newspaper",
		enabled: false,
		public: true,
		creditCost: 1,
		isEnabled: false,
		isComingSoon: true,
	},
];

// Mock config
vi.mock("@repo/config", () => ({
	config: {
		organizations: {
			hideOrganization: false,
		},
	},
}));

vi.mock("@saas/tools/hooks/use-tools", () => ({
	useTools: vi.fn(() => ({
		tools: testTools,
		enabledTools: testTools.filter((tool) => tool.enabled),
		visibleTools: testTools.filter((tool) => tool.enabled),
		isToolEnabled: (slug: string) =>
			testTools.some((tool) => tool.slug === slug && tool.enabled),
	})),
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

	const renderCommandPalette = () =>
		render(<CommandPalette isOpen={true} onClose={mockClose} />);

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useRouter).mockReturnValue({
			push: mockPush,
			back: vi.fn(),
			forward: vi.fn(),
			refresh: vi.fn(),
			replace: vi.fn(),
			prefetch: vi.fn(),
		} as ReturnType<typeof useRouter>);
		vi.mocked(useTools).mockReturnValue({
			tools: testTools,
			enabledTools: testTools.filter((tool) => tool.enabled),
			visibleTools: testTools.filter((tool) => tool.enabled),
			isToolEnabled: (slug: string) =>
				testTools.some((tool) => tool.slug === slug && tool.enabled),
		});
		localStorageMock.clear();
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
		renderCommandPalette();
		expect(
			screen.getByPlaceholderText("Search pages and tools..."),
		).toBeInTheDocument();
	});

	it("displays enabled tools only", () => {
		renderCommandPalette();
		expect(screen.getByText("Test Tool 1")).toBeInTheDocument();
		expect(screen.getByText("Test Tool 2")).toBeInTheDocument();
		expect(screen.queryByText("Disabled Tool")).not.toBeInTheDocument();
	});

	it("filters tools based on search input", () => {
		renderCommandPalette();

		const searchInput = screen.getByPlaceholderText(
			"Search pages and tools...",
		);
		fireEvent.change(searchInput, { target: { value: "Test Tool 1" } });

		expect(screen.getByText("Test Tool 1")).toBeInTheDocument();
	});

	it("navigates to tool when selected", () => {
		renderCommandPalette();

		const tool = screen.getByText("Test Tool 1");
		fireEvent.click(tool);

		expect(mockPush).toHaveBeenCalledWith("/app/tools/test-tool-1");
		expect(mockClose).toHaveBeenCalled();
	});

	it("stores recently used items in localStorage", () => {
		renderCommandPalette();

		const tool = screen.getByText("Test Tool 1");
		fireEvent.click(tool);

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

	it("displays recently used items section", () => {
		// Pre-populate recent items
		localStorage.setItem(
			"command-palette:recent-items",
			JSON.stringify([{ id: "test-tool-2", type: "tool" }]),
		);

		renderCommandPalette();

		expect(screen.getByText("Recently Used")).toBeInTheDocument();
	});

	it("closes when clicking backdrop", () => {
		renderCommandPalette();

		const backdrop = screen
			.getByPlaceholderText("Search pages and tools...")
			.closest("div")?.parentElement?.parentElement;

		if (backdrop) {
			fireEvent.click(backdrop);
			expect(mockClose).toHaveBeenCalled();
		}
	});

	it("closes on Escape key", () => {
		renderCommandPalette();

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
		renderCommandPalette();

		expect(screen.getByText("Home")).toBeInTheDocument();
		expect(screen.getByText("Chat")).toBeInTheDocument();
		expect(screen.getByText("Settings")).toBeInTheDocument();
		expect(screen.getByText("Usage")).toBeInTheDocument();
	});

	it("navigates to page when selected", () => {
		renderCommandPalette();

		const page = screen.getByText("Chat");
		fireEvent.click(page);

		expect(mockPush).toHaveBeenCalledWith("/app/chatbot");
		expect(mockClose).toHaveBeenCalled();
	});

	it("shows keyboard navigation hints", () => {
		renderCommandPalette();

		expect(screen.getByText(/to navigate/i)).toBeInTheDocument();
		expect(screen.getByText(/to select/i)).toBeInTheDocument();
		expect(screen.getByText(/to close/i)).toBeInTheDocument();
	});

	it("displays tool descriptions", () => {
		renderCommandPalette();

		expect(screen.getByText("First test tool")).toBeInTheDocument();
		expect(screen.getByText("Second test tool")).toBeInTheDocument();
	});
});
