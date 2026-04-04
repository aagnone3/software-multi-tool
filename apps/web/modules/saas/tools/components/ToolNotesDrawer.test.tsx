import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

const mockStorage: Record<string, string> = {};

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn() }),
	usePathname: () => "/app/tools/news-analyzer",
}));

beforeEach(() => {
	mockTrack.mockClear();
	for (const k of Object.keys(mockStorage)) {
		delete mockStorage[k];
	}
	vi.spyOn(Storage.prototype, "getItem").mockImplementation(
		(key) => mockStorage[key] ?? null,
	);
	vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
		mockStorage[key] = value;
	});
	vi.spyOn(Storage.prototype, "removeItem").mockImplementation((key) => {
		delete mockStorage[key];
	});
});

async function openDrawer() {
	const { ToolNotesDrawer } = await import("./ToolNotesDrawer");
	render(
		<ToolNotesDrawer toolSlug="news-analyzer" toolName="News Analyzer" />,
	);
	await userEvent.click(screen.getByRole("button", { name: /notes/i }));
}

describe("ToolNotesDrawer", () => {
	it("renders Notes trigger button", async () => {
		const { ToolNotesDrawer } = await import("./ToolNotesDrawer");
		render(
			<ToolNotesDrawer
				toolSlug="news-analyzer"
				toolName="News Analyzer"
			/>,
		);
		expect(
			screen.getByRole("button", { name: /notes/i }),
		).toBeInTheDocument();
	});

	it("opens sheet with title on click", async () => {
		await openDrawer();
		expect(screen.getByText("Notes — News Analyzer")).toBeInTheDocument();
	});

	it("textarea is present and editable", async () => {
		await openDrawer();
		const textarea = screen.getByRole("textbox", { name: /tool notes/i });
		expect(textarea).toBeInTheDocument();
		await userEvent.type(textarea, "hello");
		expect(textarea).toHaveValue("hello");
	});

	it("Save button enabled when text changes", async () => {
		await openDrawer();
		const textarea = screen.getByRole("textbox", { name: /tool notes/i });
		await userEvent.type(textarea, "note");
		expect(
			screen.getByRole("button", { name: /save changes/i }),
		).not.toBeDisabled();
	});

	it("saves to localStorage on Save click", async () => {
		const { toast } = await import("sonner");
		await openDrawer();
		const textarea = screen.getByRole("textbox", { name: /tool notes/i });
		await userEvent.type(textarea, "my note");
		await userEvent.click(
			screen.getByRole("button", { name: /save changes/i }),
		);
		expect(mockStorage["tool-notes:news-analyzer"]).toBe("my note");
		expect(toast.success).toHaveBeenCalledWith("Notes saved");
	});

	it("clears notes on Clear click", async () => {
		mockStorage["tool-notes:news-analyzer"] = "existing note";
		await openDrawer();
		await userEvent.click(
			screen.getByRole("button", { name: /clear notes/i }),
		);
		expect(mockStorage["tool-notes:news-analyzer"]).toBeUndefined();
	});

	it("tracks tool_notes_opened when drawer opens", async () => {
		await openDrawer();
		expect(mockTrack).toHaveBeenCalledWith({
			name: "tool_notes_opened",
			props: { tool_slug: "news-analyzer" },
		});
	});

	it("tracks tool_notes_saved with character count on save", async () => {
		await openDrawer();
		const textarea = screen.getByRole("textbox", { name: /tool notes/i });
		await userEvent.type(textarea, "my note");
		await userEvent.click(
			screen.getByRole("button", { name: /save changes/i }),
		);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "tool_notes_saved",
			props: { tool_slug: "news-analyzer", character_count: 7 },
		});
	});

	it("tracks tool_notes_cleared on clear", async () => {
		mockStorage["tool-notes:news-analyzer"] = "existing note";
		await openDrawer();
		await userEvent.click(
			screen.getByRole("button", { name: /clear notes/i }),
		);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "tool_notes_cleared",
			props: { tool_slug: "news-analyzer" },
		});
	});
});
