import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { SocialProofBar } from "./SocialProofBar";

describe("SocialProofBar", () => {
	it("renders all stat labels", () => {
		render(<SocialProofBar />);
		expect(screen.getByText("Businesses using it")).toBeDefined();
		expect(screen.getByText("Saved per user/month")).toBeDefined();
		expect(screen.getByText("Average rating")).toBeDefined();
		expect(screen.getByText("Average processing time")).toBeDefined();
		expect(screen.getByText("Security compliant")).toBeDefined();
	});

	it("renders stat values", () => {
		render(<SocialProofBar />);
		expect(screen.getByText("500+")).toBeDefined();
		expect(screen.getByText("4.9 / 5")).toBeDefined();
		expect(screen.getByText("SOC 2")).toBeDefined();
	});
});
