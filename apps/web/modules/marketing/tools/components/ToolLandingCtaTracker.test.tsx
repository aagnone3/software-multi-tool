import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
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

import { ToolLandingCtaTracker } from "./ToolLandingCtaTracker";

describe("ToolLandingCtaTracker", () => {
	it("renders default label and href", () => {
		render(
			<ToolLandingCtaTracker
				toolSlug="meeting-summarizer"
				toolName="Meeting Summarizer"
			/>,
		);
		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", "/auth/signup");
		expect(link).toHaveTextContent("Get Started Free");
	});

	it("tracks tool_marketing_cta_clicked on click", async () => {
		const user = userEvent.setup();
		render(
			<ToolLandingCtaTracker
				toolSlug="meeting-summarizer"
				toolName="Meeting Summarizer"
				source="test_source"
			/>,
		);
		await user.click(screen.getByRole("link"));
		expect(mockTrack).toHaveBeenCalledWith({
			name: "tool_marketing_cta_clicked",
			props: {
				tool_slug: "meeting-summarizer",
				tool_name: "Meeting Summarizer",
				source: "test_source",
			},
		});
	});

	it("uses custom href and label", () => {
		render(
			<ToolLandingCtaTracker
				toolSlug="foo"
				toolName="Foo"
				href="/custom"
				label="Try Now"
			/>,
		);
		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", "/custom");
		expect(link).toHaveTextContent("Try Now");
	});
});
