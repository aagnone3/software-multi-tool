import { fireEvent, render } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mockToggle = vi.fn();
vi.mock("./CommandPaletteProvider", () => ({
	useCommandPalette: () => ({ toggle: mockToggle }),
}));

import { CommandPaletteShortcut } from "./CommandPaletteShortcut";

describe("CommandPaletteShortcut", () => {
	it("renders nothing visually", () => {
		const { container } = render(<CommandPaletteShortcut />);
		expect(container).toBeEmptyDOMElement();
	});

	it("calls toggle on Cmd+K", () => {
		render(<CommandPaletteShortcut />);
		fireEvent.keyDown(document, { key: "k", metaKey: true });
		expect(mockToggle).toHaveBeenCalledTimes(1);
	});

	it("calls toggle on Ctrl+K", () => {
		mockToggle.mockClear();
		render(<CommandPaletteShortcut />);
		fireEvent.keyDown(document, { key: "k", ctrlKey: true });
		expect(mockToggle).toHaveBeenCalledTimes(1);
	});

	it("does not call toggle on plain K", () => {
		mockToggle.mockClear();
		render(<CommandPaletteShortcut />);
		fireEvent.keyDown(document, { key: "k" });
		expect(mockToggle).not.toHaveBeenCalled();
	});
});
