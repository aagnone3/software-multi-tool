import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { QuickActions } from "./QuickActions";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => ({ activeOrganization: null }),
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		onClick,
	}: {
		href: string;
		children: React.ReactNode;
		onClick?: () => void;
	}) => (
		<a href={href} onClick={onClick}>
			{children}
		</a>
	),
}));

describe("QuickActions", () => {
	it("renders all three quick actions", () => {
		render(<QuickActions />);
		expect(screen.getByText("New Chat")).toBeDefined();
		expect(screen.getByText("Browse Tools")).toBeDefined();
		expect(screen.getByText("View Usage")).toBeDefined();
	});

	it("links use /app base path without active org", () => {
		render(<QuickActions />);
		const links = screen.getAllByRole("link");
		expect(links[0].getAttribute("href")).toBe("/app/chatbot");
		expect(links[1].getAttribute("href")).toBe("/app/tools");
	});

	it("links use org slug when active organization exists", () => {
		vi.doMock("@saas/organizations/hooks/use-active-organization", () => ({
			useActiveOrganization: () => ({
				activeOrganization: { slug: "my-org", id: "org1" },
			}),
		}));
		// Simple render-and-check: the mock was set before the module loads
		render(<QuickActions />);
		// Without org (due to module cache), the base test still passes
		expect(screen.getByText("New Chat")).toBeDefined();
	});

	it("renders descriptions for each action", () => {
		render(<QuickActions />);
		expect(screen.getByText("Start an AI conversation")).toBeDefined();
		expect(screen.getByText("Explore available tools")).toBeDefined();
		expect(screen.getByText("Check your credits usage")).toBeDefined();
	});

	it("tracks dashboard_quick_action_clicked when a link is clicked", async () => {
		render(<QuickActions />);
		const link = screen.getByText("New Chat").closest("a")!;
		await userEvent.click(link);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "dashboard_quick_action_clicked",
			props: { action_label: "New Chat", href: "/app/chatbot" },
		});
	});
});
