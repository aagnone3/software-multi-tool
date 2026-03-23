import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockStorage: Record<string, string> = {};

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn() }),
	usePathname: () => "/app/tools/news-analyzer",
}));

beforeEach(() => {
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
});
