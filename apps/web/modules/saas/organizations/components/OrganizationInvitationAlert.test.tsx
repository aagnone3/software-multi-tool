import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { OrganizationInvitationAlert } from "./OrganizationInvitationAlert";

vi.mock("@ui/components/alert", () => ({
	Alert: ({
		children,
		className,
	}: {
		children: React.ReactNode;
		className?: string;
	}) => (
		<div data-testid="alert" className={className}>
			{children}
		</div>
	),
	AlertTitle: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="alert-title">{children}</div>
	),
	AlertDescription: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="alert-description">{children}</div>
	),
}));

vi.mock("lucide-react", () => ({
	MailCheckIcon: () => <svg data-testid="mail-check-icon" />,
}));

describe("OrganizationInvitationAlert", () => {
	it("renders the invitation alert", () => {
		render(<OrganizationInvitationAlert />);
		expect(screen.getByTestId("alert")).toBeInTheDocument();
		expect(screen.getByTestId("mail-check-icon")).toBeInTheDocument();
	});

	it("shows the correct title", () => {
		render(<OrganizationInvitationAlert />);
		expect(screen.getByTestId("alert-title")).toHaveTextContent(
			"You have been invited to join an organization.",
		);
	});

	it("shows the correct description", () => {
		render(<OrganizationInvitationAlert />);
		expect(screen.getByTestId("alert-description")).toHaveTextContent(
			"You need to sign in or create an account to join the organization.",
		);
	});

	it("applies className to the Alert", () => {
		render(<OrganizationInvitationAlert className="custom-class" />);
		expect(screen.getByTestId("alert")).toHaveClass("custom-class");
	});
});
