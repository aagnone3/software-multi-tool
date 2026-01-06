import { act, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import {
	CommandPaletteProvider,
	useCommandPalette,
} from "./CommandPaletteProvider";

// Mock the CommandPalette component
vi.mock("./CommandPalette", () => ({
	CommandPalette: ({ isOpen }: { isOpen: boolean }) => (
		<div data-testid="command-palette">{isOpen ? "open" : "closed"}</div>
	),
}));

// Test component that uses the hook
function TestComponent() {
	const { isOpen, open, close, toggle } = useCommandPalette();

	return (
		<div>
			<div data-testid="status">{isOpen ? "open" : "closed"}</div>
			<button type="button" onClick={open}>
				Open
			</button>
			<button type="button" onClick={close}>
				Close
			</button>
			<button type="button" onClick={toggle}>
				Toggle
			</button>
		</div>
	);
}

describe("CommandPaletteProvider", () => {
	it("throws error when useCommandPalette is used outside provider", () => {
		// Suppress console.error for this test
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		expect(() => {
			render(<TestComponent />);
		}).toThrow(
			"useCommandPalette must be used within a CommandPaletteProvider",
		);

		consoleError.mockRestore();
	});

	it("provides command palette context to children", () => {
		render(
			<CommandPaletteProvider>
				<TestComponent />
			</CommandPaletteProvider>,
		);

		expect(screen.getByTestId("status")).toHaveTextContent("closed");
	});

	it("opens command palette when open is called", () => {
		render(
			<CommandPaletteProvider>
				<TestComponent />
			</CommandPaletteProvider>,
		);

		const openButton = screen.getByText("Open");

		act(() => {
			openButton.click();
		});

		expect(screen.getByTestId("status")).toHaveTextContent("open");
		expect(screen.getByTestId("command-palette")).toHaveTextContent("open");
	});

	it("closes command palette when close is called", () => {
		render(
			<CommandPaletteProvider>
				<TestComponent />
			</CommandPaletteProvider>,
		);

		const openButton = screen.getByText("Open");
		const closeButton = screen.getByText("Close");

		act(() => {
			openButton.click();
		});

		expect(screen.getByTestId("status")).toHaveTextContent("open");

		act(() => {
			closeButton.click();
		});

		expect(screen.getByTestId("status")).toHaveTextContent("closed");
	});

	it("toggles command palette when toggle is called", () => {
		render(
			<CommandPaletteProvider>
				<TestComponent />
			</CommandPaletteProvider>,
		);

		const toggleButton = screen.getByText("Toggle");

		// Initially closed
		expect(screen.getByTestId("status")).toHaveTextContent("closed");

		// Toggle to open
		act(() => {
			toggleButton.click();
		});

		expect(screen.getByTestId("status")).toHaveTextContent("open");

		// Toggle to closed
		act(() => {
			toggleButton.click();
		});

		expect(screen.getByTestId("status")).toHaveTextContent("closed");
	});

	it("renders CommandPalette component", () => {
		render(
			<CommandPaletteProvider>
				<div>Child content</div>
			</CommandPaletteProvider>,
		);

		expect(screen.getByTestId("command-palette")).toBeInTheDocument();
		expect(screen.getByText("Child content")).toBeInTheDocument();
	});
});
