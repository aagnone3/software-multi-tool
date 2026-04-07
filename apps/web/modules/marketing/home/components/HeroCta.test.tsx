import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { HeroCta } from "./HeroCta";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

describe("HeroCta", () => {
	it("renders signup and tools links", () => {
		render(<HeroCta />);
		expect(
			screen.getByRole("link", { name: /10 free credits/i }),
		).toHaveAttribute("href", "/auth/signup");
		expect(
			screen.getByRole("link", { name: /see all tools/i }),
		).toHaveAttribute("href", "/tools");
	});

	it("tracks signup CTA click", async () => {
		render(<HeroCta />);
		await userEvent.click(
			screen.getByRole("link", { name: /10 free credits/i }),
		);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "hero_cta_clicked",
			props: { cta: "signup", position: "hero" },
		});
	});

	it("tracks see all tools CTA click", async () => {
		render(<HeroCta />);
		await userEvent.click(
			screen.getByRole("link", { name: /see all tools/i }),
		);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "hero_cta_clicked",
			props: { cta: "see_all_tools", position: "hero" },
		});
	});
});
