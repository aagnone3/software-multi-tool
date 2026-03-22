import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { SettingsMenu } from "./SettingsMenu";

vi.mock("next/navigation", () => ({
	usePathname: () => "/settings/general",
}));

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
		...props
	}: {
		children: React.ReactNode;
		href: string;
		[key: string]: unknown;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

const menuItems = [
	{
		title: "Account",
		avatar: <span data-testid="avatar">A</span>,
		items: [
			{ title: "General", href: "/settings/general", icon: null },
			{ title: "Security", href: "/settings/security", icon: null },
		],
	},
	{
		title: "Organization",
		avatar: <span data-testid="org-avatar">O</span>,
		items: [{ title: "Members", href: "/settings/members", icon: null }],
	},
];

describe("SettingsMenu", () => {
	it("renders section titles", () => {
		render(<SettingsMenu menuItems={menuItems} />);
		expect(screen.getByText("Account")).toBeTruthy();
		expect(screen.getByText("Organization")).toBeTruthy();
	});

	it("renders all menu items", () => {
		render(<SettingsMenu menuItems={menuItems} />);
		expect(screen.getByText("General")).toBeTruthy();
		expect(screen.getByText("Security")).toBeTruthy();
		expect(screen.getByText("Members")).toBeTruthy();
	});

	it("marks the active menu item with data-active=true", () => {
		render(<SettingsMenu menuItems={menuItems} />);
		const generalLink = screen.getByText("General").closest("a");
		expect(generalLink?.getAttribute("data-active")).toBe("true");
	});

	it("marks inactive items with data-active=false", () => {
		render(<SettingsMenu menuItems={menuItems} />);
		const securityLink = screen.getByText("Security").closest("a");
		expect(securityLink?.getAttribute("data-active")).toBe("false");
	});

	it("renders section avatars", () => {
		render(<SettingsMenu menuItems={menuItems} />);
		expect(screen.getByTestId("avatar")).toBeTruthy();
		expect(screen.getByTestId("org-avatar")).toBeTruthy();
	});

	it("renders links with correct hrefs", () => {
		render(<SettingsMenu menuItems={menuItems} />);
		const generalLink = screen.getByText("General").closest("a");
		expect(generalLink?.getAttribute("href")).toBe("/settings/general");
	});
});
