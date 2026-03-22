import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";

describe("KeyboardShortcutsHelp", () => {
	it("renders nothing initially (dialog closed)", () => {
		const { container } = render(<KeyboardShortcutsHelp />);
		expect(
			screen.queryByText("Keyboard Shortcuts"),
		).not.toBeInTheDocument();
	});

	it("opens dialog when ? key is pressed", () => {
		render(<KeyboardShortcutsHelp />);
		fireEvent.keyDown(document, { key: "?" });
		expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
	});

	it("shows all navigation shortcuts", () => {
		render(<KeyboardShortcutsHelp />);
		fireEvent.keyDown(document, { key: "?" });
		expect(screen.getByText("Go to Dashboard")).toBeInTheDocument();
		expect(screen.getByText("Go to Tools")).toBeInTheDocument();
		expect(screen.getByText("Go to Jobs")).toBeInTheDocument();
		expect(screen.getByText("Go to Settings")).toBeInTheDocument();
	});

	it("does not open when ? is pressed in an input", () => {
		render(
			<>
				<KeyboardShortcutsHelp />
				<input data-testid="inp" />
			</>,
		);
		const input = screen.getByTestId("inp");
		fireEvent.keyDown(input, { key: "?", target: input });
		expect(
			screen.queryByText("Keyboard Shortcuts"),
		).not.toBeInTheDocument();
	});

	it("closes dialog when ? is pressed again", () => {
		render(<KeyboardShortcutsHelp />);
		fireEvent.keyDown(document, { key: "?" });
		expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
		fireEvent.keyDown(document, { key: "?" });
		expect(
			screen.queryByText("Keyboard Shortcuts"),
		).not.toBeInTheDocument();
	});

	it("shows the Help section with ? shortcut", () => {
		render(<KeyboardShortcutsHelp />);
		fireEvent.keyDown(document, { key: "?" });
		expect(screen.getByText("Show keyboard shortcuts")).toBeInTheDocument();
	});
});
