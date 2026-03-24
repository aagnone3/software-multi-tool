import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToolNotes } from "./ToolNotes";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@ui/components/button", () => ({
	Button: ({
		children,
		onClick,
		disabled,
		"aria-label": al,
		...props
	}: React.ComponentProps<"button"> & { "aria-label"?: string }) => (
		<button
			onClick={onClick}
			disabled={disabled}
			aria-label={al}
			{...props}
		>
			{children}
		</button>
	),
}));
vi.mock("@ui/components/textarea", () => ({
	Textarea: ({
		"aria-label": al,
		...props
	}: React.ComponentProps<"textarea"> & { "aria-label"?: string }) => (
		<textarea aria-label={al} {...props} />
	),
}));

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
	};
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("ToolNotes", () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	it("renders My Notes toggle button", () => {
		render(<ToolNotes toolSlug="contract-analyzer" />);
		expect(screen.getByText("My Notes")).toBeDefined();
	});

	it("shows textarea after opening", () => {
		render(<ToolNotes toolSlug="contract-analyzer" />);
		fireEvent.click(screen.getByText("My Notes"));
		const textarea = screen.getByRole("textbox", { name: "Tool notes" });
		expect(textarea).toBeDefined();
		expect((textarea as HTMLTextAreaElement).placeholder).toContain(
			"Add personal notes",
		);
	});

	it("loads existing note from localStorage", () => {
		localStorageMock.setItem(
			"tool-notes",
			JSON.stringify({ "contract-analyzer": "My tip" }),
		);
		render(<ToolNotes toolSlug="contract-analyzer" />);
		fireEvent.click(screen.getByText("My Notes"));
		expect(
			(
				screen.getByRole("textbox", {
					name: "Tool notes",
				}) as HTMLTextAreaElement
			).value,
		).toBe("My tip");
	});

	it("Save button is disabled initially when no change", () => {
		render(<ToolNotes toolSlug="contract-analyzer" />);
		fireEvent.click(screen.getByText("My Notes"));
		const saveBtn = screen.getByRole("button", { name: "Save note" });
		expect((saveBtn as HTMLButtonElement).disabled).toBe(true);
	});

	it("enables Save button when note changes", () => {
		render(<ToolNotes toolSlug="contract-analyzer" />);
		fireEvent.click(screen.getByText("My Notes"));
		const textarea = screen.getByRole("textbox", {
			name: "Tool notes",
		}) as HTMLTextAreaElement;
		fireEvent.change(textarea, { target: { value: "New content" } });
		const saveBtn = screen.getByRole("button", { name: "Save note" });
		expect((saveBtn as HTMLButtonElement).disabled).toBe(false);
	});

	it("saves note to localStorage on Save click", async () => {
		const { toast } = await import("sonner");
		render(<ToolNotes toolSlug="contract-analyzer" />);
		fireEvent.click(screen.getByText("My Notes"));
		const textarea = screen.getByRole("textbox", {
			name: "Tool notes",
		}) as HTMLTextAreaElement;
		fireEvent.change(textarea, { target: { value: "Important tip" } });
		fireEvent.click(screen.getByRole("button", { name: "Save note" }));
		const stored = JSON.parse(
			localStorageMock.getItem("tool-notes") ?? "{}",
		);
		expect(stored["contract-analyzer"]).toBe("Important tip");
		expect(toast.success).toHaveBeenCalledWith("Note saved");
	});

	it("shows character count when note has content", () => {
		render(<ToolNotes toolSlug="contract-analyzer" />);
		fireEvent.click(screen.getByText("My Notes"));
		const textarea = screen.getByRole("textbox", {
			name: "Tool notes",
		}) as HTMLTextAreaElement;
		fireEvent.change(textarea, { target: { value: "hello" } });
		expect(screen.getByText("5 characters")).toBeDefined();
	});

	it("shows 'No notes yet' when empty", () => {
		render(<ToolNotes toolSlug="contract-analyzer" />);
		fireEvent.click(screen.getByText("My Notes"));
		expect(screen.getByText("No notes yet")).toBeDefined();
	});
});
