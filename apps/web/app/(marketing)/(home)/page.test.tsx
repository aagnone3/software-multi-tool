import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

// Mock all marketing home section components
vi.mock("@marketing/home/components/BeforeAfter", () => ({
	BeforeAfter: () => <section data-testid="before-after" />,
}));
vi.mock("@marketing/home/components/ExitIntentModal", () => ({
	ExitIntentModal: () => <div data-testid="exit-intent-modal" />,
}));
vi.mock("@marketing/home/components/FaqSection", () => ({
	FaqSection: () => <section data-testid="faq-section" />,
}));
vi.mock("@marketing/home/components/Features", () => ({
	Features: () => <section data-testid="features" />,
}));
vi.mock("@marketing/home/components/FinalCta", () => ({
	FinalCta: () => <section data-testid="final-cta" />,
}));
vi.mock("@marketing/home/components/Hero", () => ({
	Hero: () => <section data-testid="hero" />,
}));
vi.mock("@marketing/home/components/HowItWorks", () => ({
	HowItWorks: () => <section data-testid="how-it-works" />,
}));
vi.mock("@marketing/home/components/PricingSection", () => ({
	PricingSection: () => <section data-testid="pricing-section" />,
}));
vi.mock("@marketing/home/components/SocialProofBar", () => ({
	SocialProofBar: () => <section data-testid="social-proof-bar" />,
}));
vi.mock("@marketing/home/components/StatsBar", () => ({
	StatsBar: () => <section data-testid="stats-bar" />,
}));
vi.mock("@marketing/home/components/StickyCta", () => ({
	StickyCta: () => <div data-testid="sticky-cta" />,
}));
vi.mock("@marketing/home/components/Testimonials", () => ({
	Testimonials: () => <section data-testid="testimonials" />,
}));
vi.mock("@marketing/home/components/WhoIsItFor", () => ({
	WhoIsItFor: () => <section data-testid="who-is-it-for" />,
}));

describe("Home page", () => {
	it("renders all major sections without crashing", async () => {
		const { default: Home } = await import("./page");
		const jsx = await Home();
		render(jsx);

		const sections = [
			"exit-intent-modal",
			"sticky-cta",
			"hero",
			"social-proof-bar",
			"stats-bar",
			"who-is-it-for",
			"before-after",
			"features",
			"how-it-works",
			"testimonials",
			"pricing-section",
			"faq-section",
			"final-cta",
		];

		for (const id of sections) {
			expect(
				document.querySelector(`[data-testid="${id}"]`),
			).toBeInTheDocument();
		}
	});
});
