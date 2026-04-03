import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToolCollectionsPanel } from "./ToolCollectionsPanel";

const mockCollections = [
	{
		id: "col-1",
		name: "My Workflows",
		description: "Useful tools",
		toolSlugs: ["news-analyzer", "invoice-processor"],
	},
	{
		id: "col-2",
		name: "Quick Access",
		description: "",
		toolSlugs: [],
	},
];

const mockHook = {
	collections: mockCollections,
	createCollection: vi
		.fn()
		.mockReturnValue({ id: "new-id", name: "New Col" }),
	deleteCollection: vi.fn(),
	addToolToCollection: vi.fn(),
	removeToolFromCollection: vi.fn(),
	getCollectionsForTool: vi.fn().mockReturnValue([mockCollections[0]]),
};

vi.mock("../hooks/use-tool-collections", () => ({
	useToolCollections: () => mockHook,
}));

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("next/link", () => ({
	default: ({
		href,
		children,
	}: {
		href: string;
		children: React.ReactNode;
	}) => <a href={href}>{children}</a>,
}));

describe("ToolCollectionsPanel", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockHook.collections = mockCollections;
	});

	it("renders Collections heading", () => {
		render(<ToolCollectionsPanel />);
		expect(screen.getByText("Collections")).toBeDefined();
	});

	it("shows collection count badge", () => {
		render(<ToolCollectionsPanel />);
		expect(screen.getByText("2")).toBeDefined();
	});

	it("renders collection names", () => {
		render(<ToolCollectionsPanel />);
		expect(screen.getAllByText("My Workflows").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Quick Access").length).toBeGreaterThan(0);
	});

	it("shows empty state when no collections", () => {
		mockHook.collections = [];
		render(<ToolCollectionsPanel />);
		expect(
			screen.getByText(/Group your tools into collections/),
		).toBeDefined();
	});

	it("calls deleteCollection when delete button clicked", async () => {
		const user = userEvent.setup({ delay: null });
		render(<ToolCollectionsPanel />);
		const deleteButtons = screen.getAllByRole("button", {
			name: /Delete/,
		});
		await user.click(deleteButtons[0]);
		expect(mockHook.deleteCollection).toHaveBeenCalledWith("col-1");
	});

	it("shows Add/Remove buttons when currentToolSlug provided", () => {
		render(<ToolCollectionsPanel currentToolSlug="news-analyzer" />);
		// collection 1 contains news-analyzer → Remove; collection 2 does not → Add
		expect(screen.getByRole("button", { name: /Remove/ })).toBeDefined();
		expect(screen.getByRole("button", { name: /Add/ })).toBeDefined();
	});

	it("opens create dialog when New button clicked", async () => {
		const user = userEvent.setup({ delay: null });
		render(<ToolCollectionsPanel />);
		await user.click(screen.getByRole("button", { name: /New/ }));
		expect(screen.getByPlaceholderText("Collection name")).toBeDefined();
	});

	it("calls createCollection when dialog submitted", async () => {
		const user = userEvent.setup({ delay: null });
		render(<ToolCollectionsPanel />);
		await user.click(screen.getByRole("button", { name: /New/ }));
		await user.type(
			screen.getByPlaceholderText("Collection name"),
			"Test Col",
		);
		await user.click(
			screen.getByRole("button", { name: "Create Collection" }),
		);
		expect(mockHook.createCollection).toHaveBeenCalledWith(
			"Test Col",
			"",
			[],
		);
	});

	it("shows Browse by collection links when no currentToolSlug", () => {
		render(<ToolCollectionsPanel />);
		const links = screen.getAllByRole("link");
		const names = links.map((l) => l.textContent);
		expect(names).toContain("My Workflows");
		expect(names).toContain("Quick Access");
	});

	it("tracks tool_collection_created when collection is created", async () => {
		const user = userEvent.setup();
		render(<ToolCollectionsPanel currentToolSlug="invoice-processor" />);
		await user.click(screen.getByRole("button", { name: /new/i }));
		await user.type(
			screen.getByPlaceholderText("Collection name"),
			"Test Col",
		);
		await user.click(
			screen.getByRole("button", { name: "Create Collection" }),
		);
		expect(mockTrack).toHaveBeenCalledWith(
			expect.objectContaining({ name: "tool_collection_created" }),
		);
	});

	it("tracks tool_collection_deleted when delete button clicked", async () => {
		const user = userEvent.setup();
		render(<ToolCollectionsPanel />);
		const deleteButtons = screen.getAllByRole("button", {
			name: /delete/i,
		});
		await user.click(deleteButtons[0]);
		expect(mockTrack).toHaveBeenCalledWith(
			expect.objectContaining({ name: "tool_collection_deleted" }),
		);
	});

	it("tracks tool_collection_tool_added when Add button clicked", async () => {
		const user = userEvent.setup();
		// col-2 does not contain news-analyzer → shows Add
		mockHook.getCollectionsForTool.mockReturnValue([]);
		render(<ToolCollectionsPanel currentToolSlug="news-analyzer" />);
		const addButtons = screen.getAllByRole("button", { name: /add/i });
		await user.click(addButtons[0]);
		expect(mockTrack).toHaveBeenCalledWith(
			expect.objectContaining({ name: "tool_collection_tool_added" }),
		);
	});
});
