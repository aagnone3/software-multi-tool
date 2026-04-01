import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import JobsError from "./error";

vi.mock("@ui/components/button", () => ({
	Button: ({
		children,
		onClick,
		asChild,
		...props
	}: {
		children: React.ReactNode;
		onClick?: () => void;
		asChild?: boolean;
		[key: string]: unknown;
	}) => {
		if (asChild) {
			return <>{children}</>;
		}
		return (
			<button onClick={onClick} {...props}>
				{children}
			</button>
		);
	},
}));

vi.mock("lucide-react", () => ({
	AlertCircleIcon: ({ className }: { className?: string }) => (
		<svg data-testid="alert-icon" className={className} />
	),
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
	}: {
		href: string;
		children: React.ReactNode;
	}) => <a href={href}>{children}</a>,
}));

describe("JobsError", () => {
	it("renders error heading", () => {
		render(<JobsError error={new Error("test")} reset={() => {}} />);
		expect(screen.getByText("Failed to load job history")).toBeTruthy();
	});

	it("calls reset when Try again is clicked", async () => {
		const reset = vi.fn();
		render(<JobsError error={new Error("test")} reset={reset} />);
		await userEvent.click(screen.getByText("Try again"));
		expect(reset).toHaveBeenCalledTimes(1);
	});

	it("renders back to tools link", () => {
		render(<JobsError error={new Error("test")} reset={() => {}} />);
		expect(screen.getByText("Back to tools")).toBeTruthy();
	});
});
