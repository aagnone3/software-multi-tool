import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import WelcomeError from "./error";

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

describe("WelcomeError", () => {
	it("renders error heading", () => {
		render(<WelcomeError error={new Error("test")} reset={() => {}} />);
		expect(screen.getByText("Welcome page failed to load")).toBeTruthy();
	});

	it("calls reset when Try again is clicked", async () => {
		const reset = vi.fn();
		render(<WelcomeError error={new Error("test")} reset={reset} />);
		await userEvent.click(screen.getByText("Try again"));
		expect(reset).toHaveBeenCalledTimes(1);
	});

	it("renders link to dashboard", () => {
		render(<WelcomeError error={new Error("test")} reset={() => {}} />);
		const link = screen.getByText("Go to dashboard").closest("a");
		expect(link?.getAttribute("href")).toBe("/app");
	});
});
