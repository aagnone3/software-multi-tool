import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mockSetTheme = vi.fn();

vi.mock("next-themes", () => ({
	useTheme: () => ({
		resolvedTheme: "light",
		theme: "system",
		setTheme: mockSetTheme,
	}),
}));

vi.mock("usehooks-ts", () => ({
	useIsClient: () => true,
}));

vi.mock("@ui/components/button", () => ({
	Button: ({ children, ...props }: any) => (
		<button {...props}>{children}</button>
	),
}));

vi.mock("@ui/components/dropdown-menu", () => ({
	DropdownMenu: ({ children }: any) => <div>{children}</div>,
	DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
	DropdownMenuContent: ({ children }: any) => (
		<div data-testid="dropdown-content">{children}</div>
	),
	DropdownMenuRadioGroup: ({ children, onValueChange }: any) => (
		// biome-ignore lint/a11y/noStaticElementInteractions: test-only stub
		// biome-ignore lint/a11y/useKeyWithClickEvents: test-only stub
		<div data-testid="radio-group" onClick={() => onValueChange?.("dark")}>
			{children}
		</div>
	),
	DropdownMenuRadioItem: ({ children, value }: any) => (
		<div data-testid={`radio-item-${value}`}>{children}</div>
	),
}));

describe("ColorModeToggle", () => {
	it("renders the toggle button", async () => {
		const { ColorModeToggle } = await import("./ColorModeToggle");
		render(<ColorModeToggle />);
		expect(
			screen.getByRole("button", { name: /color mode/i }),
		).toBeInTheDocument();
	});

	it("renders all three mode options", async () => {
		const { ColorModeToggle } = await import("./ColorModeToggle");
		render(<ColorModeToggle />);
		expect(screen.getByTestId("radio-item-system")).toBeInTheDocument();
		expect(screen.getByTestId("radio-item-light")).toBeInTheDocument();
		expect(screen.getByTestId("radio-item-dark")).toBeInTheDocument();
	});

	it("calls setTheme when a new option is selected", async () => {
		const { ColorModeToggle } = await import("./ColorModeToggle");
		render(<ColorModeToggle />);
		await userEvent.click(screen.getByTestId("radio-group"));
		expect(mockSetTheme).toHaveBeenCalledWith("dark");
	});
});
