import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

// Mock child components
vi.mock("./OrganizationMembersList", () => ({
	OrganizationMembersList: ({
		organizationId,
	}: {
		organizationId: string;
	}) => (
		<div data-testid="members-list" data-org-id={organizationId}>
			Members List
		</div>
	),
}));

vi.mock("./OrganizationInvitationsList", () => ({
	OrganizationInvitationsList: ({
		organizationId,
	}: {
		organizationId: string;
	}) => (
		<div data-testid="invitations-list" data-org-id={organizationId}>
			Invitations List
		</div>
	),
}));

vi.mock("@saas/shared/components/SettingsItem", () => ({
	SettingsItem: ({
		children,
		title,
	}: {
		children: React.ReactNode;
		title: string;
	}) => (
		<div>
			<h2>{title}</h2>
			{children}
		</div>
	),
}));

import { OrganizationMembersBlock } from "./OrganizationMembersBlock";

describe("OrganizationMembersBlock", () => {
	it("renders with active members tab by default", () => {
		render(<OrganizationMembersBlock organizationId="org-123" />);

		expect(screen.getByText("Active members")).toBeInTheDocument();
		expect(screen.getByText("Pending invitations")).toBeInTheDocument();
		expect(screen.getByTestId("members-list")).toBeInTheDocument();
	});

	it("passes organizationId to members list", () => {
		render(<OrganizationMembersBlock organizationId="org-456" />);

		const membersList = screen.getByTestId("members-list");
		expect(membersList).toHaveAttribute("data-org-id", "org-456");
	});

	it("switches to invitations tab when clicked", async () => {
		const user = userEvent.setup({ delay: null });
		render(<OrganizationMembersBlock organizationId="org-123" />);

		await user.click(screen.getByText("Pending invitations"));

		expect(screen.getByTestId("invitations-list")).toBeInTheDocument();
	});

	it("displays the Members title", () => {
		render(<OrganizationMembersBlock organizationId="org-123" />);

		expect(screen.getByText("Members")).toBeInTheDocument();
	});
});
