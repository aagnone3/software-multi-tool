import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import JobDetailError from "./error";

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => <a href={href}>{children}</a>,
}));

vi.mock("@ui/components/button", () => ({
	Button: ({
		children,
		onClick,
		asChild,
	}: {
		children: React.ReactNode;
		onClick?: () => void;
		asChild?: boolean;
	}) =>
		asChild ? (
			<span>{children}</span>
		) : (
			<button type="button" onClick={onClick}>
				{children}
			</button>
		),
}));

describe("JobDetailError", () => {
	it("renders error heading", () => {
		const reset = vi.fn();
		render(<JobDetailError error={new Error("boom")} reset={reset} />);
		expect(screen.getByText("Failed to load job details")).toBeDefined();
	});

	it("renders descriptive message", () => {
		const reset = vi.fn();
		render(<JobDetailError error={new Error("boom")} reset={reset} />);
		expect(
			screen.getByText(/Something went wrong while loading this job/),
		).toBeDefined();
	});

	it("calls reset when Try again is clicked", () => {
		const reset = vi.fn();
		render(<JobDetailError error={new Error("boom")} reset={reset} />);
		fireEvent.click(screen.getByText("Try again"));
		expect(reset).toHaveBeenCalledOnce();
	});

	it("renders Back to jobs link", () => {
		const reset = vi.fn();
		render(<JobDetailError error={new Error("boom")} reset={reset} />);
		expect(screen.getByText("Back to jobs")).toBeDefined();
	});
});
