import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import NewOrganizationError from "./error";

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

describe("NewOrganizationError", () => {
	it("renders error heading", () => {
		render(
			<NewOrganizationError error={new Error("test")} reset={() => {}} />,
		);
		expect(
			screen.getByText("Organization creation failed to load"),
		).toBeTruthy();
	});

	it("calls reset when Try again is clicked", async () => {
		const reset = vi.fn();
		render(
			<NewOrganizationError error={new Error("test")} reset={reset} />,
		);
		await userEvent.click(screen.getByText("Try again"));
		expect(reset).toHaveBeenCalledTimes(1);
	});

	it("renders link to dashboard", () => {
		render(
			<NewOrganizationError error={new Error("test")} reset={() => {}} />,
		);
		const link = screen.getByText("Back to dashboard").closest("a");
		expect(link?.getAttribute("href")).toBe("/app");
	});
});
