import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import AdminError from "./error";

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
		if (asChild) return <>{children}</>;
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

describe("AdminError", () => {
	it("renders error heading", () => {
		render(<AdminError error={new Error("test")} reset={() => {}} />);
		expect(screen.getByText("Admin page failed to load")).toBeTruthy();
	});

	it("calls reset when Try again is clicked", async () => {
		const reset = vi.fn();
		render(<AdminError error={new Error("test")} reset={reset} />);
		await userEvent.click(screen.getByText("Try again"));
		expect(reset).toHaveBeenCalledTimes(1);
	});

	it("renders back to dashboard link", () => {
		render(<AdminError error={new Error("test")} reset={() => {}} />);
		expect(screen.getByText("Back to dashboard")).toBeTruthy();
	});
});
