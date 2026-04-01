import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToolNotes } from "./ToolNotes";

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, val: string) => {
			store[key] = val;
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		},
	};
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("ToolNotes", () => {
	beforeEach(() => localStorageMock.clear());

	it("renders My Notes button", () => {
		render(<ToolNotes toolSlug="contract-analyzer" />);
		expect(screen.getByText("My Notes")).toBeInTheDocument();
	});

	it("shows textarea when opened", async () => {
		render(<ToolNotes toolSlug="contract-analyzer" />);
		await userEvent.click(screen.getByText("My Notes"));
		expect(screen.getByLabelText("Tool notes")).toBeInTheDocument();
	});

	it("loads existing note from localStorage", async () => {
		localStorageMock.setItem(
			"tool-notes",
			JSON.stringify({ "contract-analyzer": "My tip" }),
		);
		render(<ToolNotes toolSlug="contract-analyzer" />);
		await userEvent.click(screen.getByText("My Notes"));
		expect(
			(screen.getByLabelText("Tool notes") as HTMLTextAreaElement).value,
		).toBe("My tip");
	});

	it("saves note on Save click", async () => {
		render(<ToolNotes toolSlug="contract-analyzer" />);
		await userEvent.click(screen.getByText("My Notes"));
		await userEvent.type(
			screen.getByLabelText("Tool notes"),
			"Remember this",
		);
		await userEvent.click(screen.getByLabelText("Save note"));
		const stored = JSON.parse(
			localStorageMock.getItem("tool-notes") ?? "{}",
		);
		expect(stored["contract-analyzer"]).toBe("Remember this");
	});

	it("clears note on Clear click", async () => {
		localStorageMock.setItem(
			"tool-notes",
			JSON.stringify({ "contract-analyzer": "My tip" }),
		);
		render(<ToolNotes toolSlug="contract-analyzer" />);
		await userEvent.click(screen.getByText("My Notes"));
		await userEvent.click(screen.getByLabelText("Clear note"));
		const stored = JSON.parse(
			localStorageMock.getItem("tool-notes") ?? "{}",
		);
		expect(stored["contract-analyzer"]).toBeUndefined();
	});

	it("Save button is disabled when note is unchanged", async () => {
		render(<ToolNotes toolSlug="contract-analyzer" />);
		await userEvent.click(screen.getByText("My Notes"));
		expect(screen.getByLabelText("Save note")).toBeDisabled();
	});

	it("Save button enables when note is changed", async () => {
		render(<ToolNotes toolSlug="contract-analyzer" />);
		await userEvent.click(screen.getByText("My Notes"));
		await userEvent.type(screen.getByLabelText("Tool notes"), "New text");
		expect(screen.getByLabelText("Save note")).not.toBeDisabled();
	});

	it("shows indicator dot when note exists", async () => {
		localStorageMock.setItem(
			"tool-notes",
			JSON.stringify({ "contract-analyzer": "Tip" }),
		);
		render(<ToolNotes toolSlug="contract-analyzer" />);
		expect(screen.getByLabelText("has note")).toBeInTheDocument();
	});
});
