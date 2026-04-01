import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { SocialShareButtons } from "./SocialShareButtons";

// JSDOM doesn't populate window.location.href so we simulate a realistic URL
Object.defineProperty(window, "location", {
	value: { href: "https://example.com/blog/my-post" },
	writable: true,
});

describe("SocialShareButtons", () => {
	it("renders share label", () => {
		render(<SocialShareButtons title="My Post" />);
		expect(screen.getByText("Share:")).toBeInTheDocument();
	});

	it("renders Twitter / X share link", () => {
		render(<SocialShareButtons title="My Post" />);
		expect(
			screen.getByLabelText("Share on Twitter / X"),
		).toBeInTheDocument();
	});

	it("renders LinkedIn share link", () => {
		render(<SocialShareButtons title="My Post" />);
		expect(screen.getByLabelText("Share on LinkedIn")).toBeInTheDocument();
	});

	it("Twitter link contains encoded title", () => {
		render(<SocialShareButtons title="My Post" />);
		const link = screen.getByLabelText(
			"Share on Twitter / X",
		) as HTMLAnchorElement;
		expect(link.href).toContain("twitter.com/intent/tweet");
		expect(link.href).toContain(encodeURIComponent("My Post"));
	});

	it("LinkedIn link contains sharing URL", () => {
		render(<SocialShareButtons title="My Post" />);
		const link = screen.getByLabelText(
			"Share on LinkedIn",
		) as HTMLAnchorElement;
		expect(link.href).toContain("linkedin.com/sharing/share-offsite");
	});

	it("links open in new tab", () => {
		render(<SocialShareButtons title="My Post" />);
		const links = screen.getAllByRole("link");
		for (const link of links) {
			expect(link).toHaveAttribute("target", "_blank");
			expect(link).toHaveAttribute("rel", "noopener noreferrer");
		}
	});
});
