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
		className,
	}: {
		href: string;
		children: React.ReactNode;
		onClick?: () => void;
		className?: string;
	}) => (
		<a href={href} onClick={onClick} className={className}>
			{children}
		</a>
	),
}));

import { WhoIsItFor } from "./WhoIsItFor";

describe("WhoIsItFor", () => {
	it("renders persona cards", () => {
		render(<WhoIsItFor />);
		expect(screen.getByText("Freelancer")).toBeInTheDocument();
		expect(screen.getByText("Small Business Owner")).toBeInTheDocument();
	});

	it("links persona cards to marketing tool pages (not authenticated routes)", () => {
		render(<WhoIsItFor />);
		const links = screen.getAllByRole("link");
		for (const link of links) {
			const href = link.getAttribute("href") ?? "";
			expect(href).not.toContain("/app/tools/");
			expect(href).toMatch(/^\/tools\//);
		}
	});

	it("fires who_is_it_for_tool_clicked analytics when a persona link is clicked", async () => {
		const user = userEvent.setup();
		render(<WhoIsItFor />);
		const meetingLink = screen.getByRole("link", {
			name: /Try Meeting Summarizer/i,
		});
		await user.click(meetingLink);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "who_is_it_for_tool_clicked",
			props: {
				persona_id: "freelancer",
				tool_slug: "meeting-summarizer",
			},
		});
	});

	it("includes correct tool slug in link href", () => {
		render(<WhoIsItFor />);
		const meetingLink = screen.getByRole("link", {
			name: /Try Meeting Summarizer/i,
		});
		expect(meetingLink).toHaveAttribute(
			"href",
			"/tools/meeting-summarizer",
		);
	});
});
