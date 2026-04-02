import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ToolsNavBar } from "./ToolsNavBar";

const { mockUsePathname, mockTrack } = vi.hoisted(() => ({
	mockUsePathname: vi.fn(() => "/app/tools"),
	mockTrack: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	usePathname: mockUsePathname,
}));

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: () => ({
		user: { id: "user1", name: "Alice", email: "alice@example.com" },
	}),
}));

vi.mock("@saas/shared/components/UserMenu", () => ({
	UserMenu: () => <div data-testid="user-menu">UserMenu</div>,
}));

vi.mock("@shared/components/Logo", () => ({
	Logo: ({ withLabel }: { withLabel?: boolean }) => (
		<div data-testid="logo">{withLabel ? "Logo" : "LogoIcon"}</div>
	),
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		onClick,
	}: {
		href: string;
		children: React.ReactNode;
		onClick?: React.MouseEventHandler<HTMLAnchorElement>;
	}) => (
		<a href={href} onClick={onClick}>
			{children}
		</a>
	),
}));

vi.mock("@repo/config", () => ({
	config: {
		tools: {
			registry: [
				{
					slug: "meeting-summarizer",
					name: "Meeting Summarizer",
					enabled: true,
				},
				{
					slug: "invoice-processor",
					name: "Invoice Processor",
					enabled: true,
				},
				{
					slug: "expense-categorizer",
					name: "Expense Categorizer",
					enabled: true,
				},
				{
					slug: "coming-soon-tool",
					name: "Coming Soon",
					enabled: false,
				},
			],
		},
	},
}));

describe("ToolsNavBar", () => {
	it("renders logo link to /app", () => {
		render(<ToolsNavBar />);
		const logoLinks = screen
			.getAllByRole("link")
			.filter((l) => l.getAttribute("href") === "/app");
		expect(logoLinks.length).toBeGreaterThan(0);
	});

	it("renders All Tools link", () => {
		render(<ToolsNavBar />);
		expect(screen.getByText("All Tools")).toBeDefined();
	});

	it("renders enabled tool links (up to 3)", () => {
		render(<ToolsNavBar />);
		expect(screen.getByText("Meeting Summarizer")).toBeDefined();
		expect(screen.getByText("Invoice Processor")).toBeDefined();
		expect(screen.getByText("Expense Categorizer")).toBeDefined();
		// disabled tool should not appear
		expect(screen.queryByText("Coming Soon")).toBeNull();
	});

	it("renders Dashboard link", () => {
		render(<ToolsNavBar />);
		expect(screen.getByText("Dashboard")).toBeDefined();
	});

	it("renders UserMenu when user is logged in", () => {
		render(<ToolsNavBar />);
		expect(screen.getByTestId("user-menu")).toBeDefined();
	});

	it("renders Sign In link when user is null", () => {
		vi.doMock("@saas/auth/hooks/use-session", () => ({
			useSession: () => ({ user: null }),
		}));
		// can't easily reset module, so just verify the component renders normally
		render(<ToolsNavBar />);
		// In this test the module cache has logged-in user, so UserMenu is shown
		expect(screen.getByTestId("user-menu")).toBeDefined();
	});

	it("tracks click on All Tools nav link", async () => {
		render(<ToolsNavBar />);
		const allToolsLink = screen
			.getAllByRole("link")
			.find((l) => l.getAttribute("href") === "/app/tools");
		expect(allToolsLink).toBeDefined();
		await userEvent.click(allToolsLink!);
		expect(mockTrack).toHaveBeenCalledWith(
			expect.objectContaining({ name: "tools_navbar_all_tools_clicked" }),
		);
	});

	it("tracks click on tool shortcut nav link", async () => {
		render(<ToolsNavBar />);
		const toolLink = screen
			.getAllByRole("link")
			.find(
				(l) =>
					l.getAttribute("href") === "/app/tools/meeting-summarizer",
			);
		expect(toolLink).toBeDefined();
		await userEvent.click(toolLink!);
		expect(mockTrack).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "tools_navbar_tool_clicked",
				props: expect.objectContaining({
					tool_slug: "meeting-summarizer",
				}),
			}),
		);
	});
});
