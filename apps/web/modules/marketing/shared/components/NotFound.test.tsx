import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { NotFound } from "./NotFound";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => <a href={href}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
	usePathname: () => "/some/missing-page",
}));

describe("NotFound", () => {
	it("renders 404 heading", () => {
		render(<NotFound />);
		expect(screen.getByText("404")).toBeInTheDocument();
	});

	it("renders page not found message", () => {
		render(<NotFound />);
		expect(screen.getByText("Page not found")).toBeInTheDocument();
	});

	it("renders browse AI tools link", () => {
		render(<NotFound />);
		const link = screen.getByRole("link", { name: /browse ai tools/i });
		expect(link).toHaveAttribute("href", "/tools");
	});

	it("renders go to homepage link", () => {
		render(<NotFound />);
		const link = screen.getByRole("link", { name: /go to homepage/i });
		expect(link).toHaveAttribute("href", "/");
	});

	it("fires page_not_found analytics event on mount", () => {
		render(<NotFound />);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "page_not_found",
			props: { path: "/some/missing-page" },
		});
	});
});
