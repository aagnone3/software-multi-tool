import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import {
	FactualRatingBadge,
	PoliticalLeanSpectrum,
	SensationalismRadial,
	SentimentIndicator,
} from "./news-analyzer-results";

describe("FactualRatingBadge", () => {
	it("renders high factual rating with green styling", () => {
		render(<FactualRatingBadge rating="High Confidence" />);
		expect(screen.getByText("High Confidence")).toBeInTheDocument();
		const container = screen
			.getByText("High Confidence")
			.closest("div.inline-flex");
		expect(container?.className).toContain("green");
	});

	it("renders medium factual rating with amber styling", () => {
		render(<FactualRatingBadge rating="Medium Confidence" />);
		expect(screen.getByText("Medium Confidence")).toBeInTheDocument();
		const container = screen
			.getByText("Medium Confidence")
			.closest("div.inline-flex");
		expect(container?.className).toContain("amber");
	});

	it("renders mixed factual rating with amber styling", () => {
		render(<FactualRatingBadge rating="Mixed Evidence" />);
		expect(screen.getByText("Mixed Evidence")).toBeInTheDocument();
		const container = screen
			.getByText("Mixed Evidence")
			.closest("div.inline-flex");
		expect(container?.className).toContain("amber");
	});

	it("renders low/unknown factual rating with red styling", () => {
		render(<FactualRatingBadge rating="Low Confidence" />);
		expect(screen.getByText("Low Confidence")).toBeInTheDocument();
		const container = screen
			.getByText("Low Confidence")
			.closest("div.inline-flex");
		expect(container?.className).toContain("red");
	});

	it("renders unrecognized rating with red styling (fallback)", () => {
		render(<FactualRatingBadge rating="Unknown" />);
		expect(screen.getByText("Unknown")).toBeInTheDocument();
		const container = screen
			.getByText("Unknown")
			.closest("div.inline-flex");
		expect(container?.className).toContain("red");
	});
});

describe("SentimentIndicator", () => {
	it("renders positive sentiment", () => {
		render(<SentimentIndicator sentiment="Positive" />);
		expect(screen.getByText("Positive")).toBeInTheDocument();
		expect(screen.getByText("Overall tone")).toBeInTheDocument();
	});

	it("renders negative sentiment", () => {
		render(<SentimentIndicator sentiment="Negative" />);
		expect(screen.getByText("Negative")).toBeInTheDocument();
	});

	it("renders neutral sentiment (fallback)", () => {
		render(<SentimentIndicator sentiment="Neutral" />);
		expect(screen.getByText("Neutral")).toBeInTheDocument();
	});

	it("renders 'Overall tone' label", () => {
		render(<SentimentIndicator sentiment="Positive" />);
		expect(screen.getByText("Overall tone")).toBeInTheDocument();
	});
});

describe("PoliticalLeanSpectrum", () => {
	it("renders with a lean value", () => {
		render(<PoliticalLeanSpectrum lean="Center" />);
		// "Center" appears multiple times (as active label and badge) — just check at least one exists
		expect(screen.getAllByText("Center").length).toBeGreaterThan(0);
	});

	it("renders full labels in default mode", () => {
		render(<PoliticalLeanSpectrum lean="Left" />);
		// "Left" appears multiple times (label + badge)
		expect(screen.getAllByText("Left").length).toBeGreaterThan(0);
		expect(screen.getByText("Center-Left")).toBeInTheDocument();
		expect(screen.getByText("Center-Right")).toBeInTheDocument();
		expect(screen.getByText("Right")).toBeInTheDocument();
	});

	it("renders compact labels in compact mode", () => {
		render(<PoliticalLeanSpectrum lean="Center" compact />);
		expect(screen.getAllByText("Center").length).toBeGreaterThan(0);
	});
});

describe("SensationalismRadial", () => {
	it("renders with a low value", () => {
		const { container } = render(<SensationalismRadial value={2} />);
		expect(container.querySelector("svg")).toBeInTheDocument();
	});

	it("renders with a high value", () => {
		const { container } = render(<SensationalismRadial value={9} />);
		expect(container.querySelector("svg")).toBeInTheDocument();
	});

	it("renders value number for low sensationalism", () => {
		render(<SensationalismRadial value={1} />);
		expect(screen.getByText("1")).toBeInTheDocument();
	});

	it("renders value number for moderate sensationalism", () => {
		render(<SensationalismRadial value={5} />);
		expect(screen.getByText("5")).toBeInTheDocument();
	});

	it("renders value number for high sensationalism", () => {
		render(<SensationalismRadial value={8} />);
		expect(screen.getByText("8")).toBeInTheDocument();
	});
});
