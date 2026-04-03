import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mockTrack = vi.fn();
const mockSetActiveOrganization = vi.fn();
const mockOrganizations = [
	{ id: "org1", name: "Acme Corp", slug: "acme", logo: null },
	{
		id: "org2",
		name: "Beta Inc",
		slug: "beta",
		logo: "https://example.com/logo.png",
	},
];

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => ({
		setActiveOrganization: mockSetActiveOrganization,
		activeOrganization: null,
	}),
}));

vi.mock("@saas/organizations/lib/api", () => ({
	useOrganizationListQuery: () => ({ data: mockOrganizations }),
}));

vi.mock("@saas/organizations/components/OrganizationLogo", () => ({
	OrganizationLogo: ({ name }: { name: string }) => (
		<div data-testid={`org-logo-${name}`} />
	),
}));

vi.mock("@repo/config", () => ({
	config: {
		organizations: { enableUsersToCreateOrganizations: true },
	},
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...props
	}: {
		href: string;
		children: React.ReactNode;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

import { OrganizationsGrid } from "./OrganizationsGrid";

describe("OrganizationsGrid", () => {
	it("renders organization names", () => {
		render(<OrganizationsGrid />);
		expect(screen.getByText("Acme Corp")).toBeTruthy();
		expect(screen.getByText("Beta Inc")).toBeTruthy();
	});

	it("calls setActiveOrganization on card click", async () => {
		const user = userEvent.setup();
		render(<OrganizationsGrid />);
		await user.click(screen.getByText("Acme Corp"));
		expect(mockSetActiveOrganization).toHaveBeenCalledWith("acme");
	});

	it("tracks organization_switched event on card click", async () => {
		const user = userEvent.setup();
		render(<OrganizationsGrid />);
		await user.click(screen.getByText("Acme Corp"));
		expect(mockTrack).toHaveBeenCalledWith({
			name: "organization_switched",
			props: { organization_slug: "acme" },
		});
	});

	it("shows create organization link when enabled", () => {
		render(<OrganizationsGrid />);
		const link = screen.getByRole("link", {
			name: /create new organization/i,
		});
		expect(link).toBeTruthy();
		expect(link.getAttribute("href")).toBe("/new-organization");
	});
});
