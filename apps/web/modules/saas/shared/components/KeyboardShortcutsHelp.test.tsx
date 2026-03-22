import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it } from "vitest";
import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";

describe("KeyboardShortcutsHelp", () => {
	it("renders nothing visible by default", () => {
		render(<KeyboardShortcutsHelp />);
		expect(
			screen.queryByText("Keyboard Shortcuts"),
		).not.toBeInTheDocument();
	});

	it("opens dialog when ? is pressed", async () => {
		render(<KeyboardShortcutsHelp />);
		await userEvent.keyboard("?");
		expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
	});

	it("shows navigation shortcuts", async () => {
		render(<KeyboardShortcutsHelp />);
		await userEvent.keyboard("?");
		expect(screen.getByText("Open command palette")).toBeInTheDocument();
		expect(screen.getByText("Go to dashboard")).toBeInTheDocument();
	});

	it("shows general shortcuts", async () => {
		render(<KeyboardShortcutsHelp />);
		await userEvent.keyboard("?");
		expect(screen.getByText("Show keyboard shortcuts")).toBeInTheDocument();
	});

	it("closes dialog on Escape", async () => {
		render(<KeyboardShortcutsHelp />);
		await userEvent.keyboard("?");
		expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
		await userEvent.keyboard("{Escape}");
		expect(
			screen.queryByText("Keyboard Shortcuts"),
		).not.toBeInTheDocument();
	});

	it("does not open when typing in an input", async () => {
		render(
			<>
				<input data-testid="inp" />
				<KeyboardShortcutsHelp />
			</>,
		);
		const input = screen.getByTestId("inp");
		input.focus();
		await userEvent.keyboard("?");
		expect(
			screen.queryByText("Keyboard Shortcuts"),
		).not.toBeInTheDocument();
	});
});
