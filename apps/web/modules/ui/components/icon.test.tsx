import { render, screen } from "@testing-library/react";
import { AlertCircleIcon, CheckIcon, HomeIcon } from "lucide-react";
import React from "react";
import { describe, expect, it } from "vitest";
import {
	Icon,
	type IconColor,
	type IconSize,
	iconSizeValues,
	isIconColor,
	isIconSize,
} from "./icon";

describe("Icon component", () => {
	describe("rendering", () => {
		it("renders the provided Lucide icon", () => {
			render(<Icon icon={HomeIcon} data-testid="home-icon" />);
			const icon = screen.getByTestId("home-icon");
			expect(icon).toBeInTheDocument();
			expect(icon.tagName.toLowerCase()).toBe("svg");
		});

		it("applies aria-hidden for accessibility", () => {
			render(<Icon icon={HomeIcon} data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			expect(icon).toHaveAttribute("aria-hidden", "true");
		});

		it("applies shrink-0 to prevent icon squishing in flex layouts", () => {
			render(<Icon icon={HomeIcon} data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			expect(icon).toHaveClass("shrink-0");
		});

		it("passes additional props to the underlying icon", () => {
			render(
				<Icon
					icon={HomeIcon}
					data-testid="icon"
					strokeWidth={3}
					aria-label="Home"
				/>,
			);
			const icon = screen.getByTestId("icon");
			expect(icon).toHaveAttribute("stroke-width", "3");
			expect(icon).toHaveAttribute("aria-label", "Home");
		});
	});

	describe("sizes", () => {
		const sizeTestCases: Array<{ size: IconSize; expectedClass: string }> =
			[
				{ size: "xs", expectedClass: "size-3" },
				{ size: "sm", expectedClass: "size-4" },
				{ size: "md", expectedClass: "size-5" },
				{ size: "lg", expectedClass: "size-6" },
				{ size: "xl", expectedClass: "size-8" },
				{ size: "2xl", expectedClass: "size-10" },
			];

		it.each(sizeTestCases)('applies $expectedClass for size="$size"', ({
			size,
			expectedClass,
		}) => {
			render(<Icon icon={HomeIcon} size={size} data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			expect(icon).toHaveClass(expectedClass);
		});

		it('defaults to "sm" (size-4) when no size is provided', () => {
			render(<Icon icon={HomeIcon} data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			expect(icon).toHaveClass("size-4");
		});
	});

	describe("colors", () => {
		const colorTestCases: Array<{
			color: IconColor;
			expectedClass: string | null;
		}> = [
			{ color: "primary", expectedClass: "text-primary" },
			{ color: "secondary", expectedClass: "text-secondary" },
			{ color: "muted", expectedClass: "text-muted-foreground" },
			{ color: "success", expectedClass: "text-success" },
			{ color: "destructive", expectedClass: "text-destructive" },
			{ color: "highlight", expectedClass: "text-highlight" },
			{ color: "inherit", expectedClass: null },
		];

		it.each(colorTestCases)('applies correct class for color="$color"', ({
			color,
			expectedClass,
		}) => {
			render(<Icon icon={HomeIcon} color={color} data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			if (expectedClass) {
				expect(icon).toHaveClass(expectedClass);
			} else {
				// For "inherit", no text color class should be applied
				expect(icon.className).not.toMatch(
					/text-(primary|secondary|muted)/,
				);
			}
		});

		it('defaults to "inherit" when no color is provided', () => {
			render(<Icon icon={HomeIcon} data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			// Should not have any explicit color class
			expect(icon.className).not.toMatch(
				/text-(primary|secondary|muted-foreground|success|destructive|highlight)/,
			);
		});
	});

	describe("custom className", () => {
		it("merges custom className with default classes", () => {
			render(
				<Icon
					icon={HomeIcon}
					size="md"
					className="my-custom-class"
					data-testid="icon"
				/>,
			);
			const icon = screen.getByTestId("icon");
			expect(icon).toHaveClass("my-custom-class");
			expect(icon).toHaveClass("size-5");
			expect(icon).toHaveClass("shrink-0");
		});

		it("allows overriding size class via className (Tailwind merge)", () => {
			render(
				<Icon
					icon={HomeIcon}
					size="sm"
					className="size-12"
					data-testid="icon"
				/>,
			);
			const icon = screen.getByTestId("icon");
			// Tailwind merge should allow the custom class to override
			expect(icon).toHaveClass("size-12");
		});
	});

	describe("with different icons", () => {
		it("renders CheckIcon correctly", () => {
			render(
				<Icon
					icon={CheckIcon}
					size="lg"
					color="success"
					data-testid="check"
				/>,
			);
			const icon = screen.getByTestId("check");
			expect(icon).toHaveClass("size-6");
			expect(icon).toHaveClass("text-success");
		});

		it("renders AlertCircleIcon correctly", () => {
			render(
				<Icon
					icon={AlertCircleIcon}
					size="md"
					color="destructive"
					data-testid="alert"
				/>,
			);
			const icon = screen.getByTestId("alert");
			expect(icon).toHaveClass("size-5");
			expect(icon).toHaveClass("text-destructive");
		});
	});
});

describe("iconSizeValues", () => {
	it("exports correct pixel values for all sizes", () => {
		expect(iconSizeValues.xs).toBe(12);
		expect(iconSizeValues.sm).toBe(16);
		expect(iconSizeValues.md).toBe(20);
		expect(iconSizeValues.lg).toBe(24);
		expect(iconSizeValues.xl).toBe(32);
		expect(iconSizeValues["2xl"]).toBe(40);
	});
});

describe("isIconSize type guard", () => {
	it("returns true for valid icon sizes", () => {
		expect(isIconSize("xs")).toBe(true);
		expect(isIconSize("sm")).toBe(true);
		expect(isIconSize("md")).toBe(true);
		expect(isIconSize("lg")).toBe(true);
		expect(isIconSize("xl")).toBe(true);
		expect(isIconSize("2xl")).toBe(true);
	});

	it("returns false for invalid values", () => {
		expect(isIconSize("invalid")).toBe(false);
		expect(isIconSize("")).toBe(false);
		expect(isIconSize(null)).toBe(false);
		expect(isIconSize(undefined)).toBe(false);
		expect(isIconSize(123)).toBe(false);
		expect(isIconSize({})).toBe(false);
	});
});

describe("isIconColor type guard", () => {
	it("returns true for valid icon colors", () => {
		expect(isIconColor("inherit")).toBe(true);
		expect(isIconColor("primary")).toBe(true);
		expect(isIconColor("secondary")).toBe(true);
		expect(isIconColor("muted")).toBe(true);
		expect(isIconColor("success")).toBe(true);
		expect(isIconColor("destructive")).toBe(true);
		expect(isIconColor("highlight")).toBe(true);
	});

	it("returns false for invalid values", () => {
		expect(isIconColor("invalid")).toBe(false);
		expect(isIconColor("red")).toBe(false);
		expect(isIconColor("")).toBe(false);
		expect(isIconColor(null)).toBe(false);
		expect(isIconColor(undefined)).toBe(false);
		expect(isIconColor(123)).toBe(false);
	});
});
