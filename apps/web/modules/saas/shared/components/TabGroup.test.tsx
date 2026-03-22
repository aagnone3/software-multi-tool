import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { TabGroup } from "./TabGroup";

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
		className,
	}: {
		children: React.ReactNode;
		href: string;
		className?: string;
	}) => (
		<a href={href} className={className}>
			{children}
		</a>
	),
}));

vi.mock("next/navigation", () => ({
	useSelectedLayoutSegment: vi.fn().mockReturnValue("settings"),
}));

describe("TabGroup", () => {
	const items = [
		{ label: "Settings", href: "/settings", segment: "settings" },
		{ label: "Profile", href: "/profile", segment: "profile" },
		{ label: "Billing", href: "/billing", segment: "billing" },
	];

	it("renders all tab items", () => {
		render(<TabGroup items={items} />);
		expect(screen.getByText("Settings")).toBeTruthy();
		expect(screen.getByText("Profile")).toBeTruthy();
		expect(screen.getByText("Billing")).toBeTruthy();
	});

	it("renders correct hrefs", () => {
		render(<TabGroup items={items} />);
		const settingsLink = screen.getByText("Settings").closest("a");
		expect(settingsLink?.getAttribute("href")).toBe("/settings");
	});

	it("applies active style to active segment", () => {
		render(<TabGroup items={items} />);
		const activeLink = screen.getByText("Settings").closest("a");
		expect(activeLink?.className).toContain("border-primary");
		expect(activeLink?.className).toContain("font-bold");
	});

	it("applies inactive style to non-active segments", () => {
		render(<TabGroup items={items} />);
		const inactiveLink = screen.getByText("Profile").closest("a");
		expect(inactiveLink?.className).toContain("border-transparent");
	});

	it("applies className to wrapper", () => {
		const { container } = render(
			<TabGroup items={items} className="custom-class" />,
		);
		expect((container.firstChild as HTMLElement)?.className).toContain(
			"custom-class",
		);
	});

	it("renders empty when no items", () => {
		render(<TabGroup items={[]} />);
		expect(screen.queryByRole("link")).toBeNull();
	});
});
