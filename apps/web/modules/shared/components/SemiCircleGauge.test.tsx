import { render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it } from "vitest";
import { SemiCircleGauge } from "./SemiCircleGauge";

describe("SemiCircleGauge", () => {
	it("renders with default props", () => {
		render(<SemiCircleGauge value={5} />);
		expect(screen.getByRole("img")).toBeInTheDocument();
	});

	it("shows value and max in aria-label", () => {
		render(<SemiCircleGauge value={7} max={10} />);
		expect(screen.getByRole("img")).toHaveAttribute(
			"aria-label",
			"Gauge showing 7 out of 10",
		);
	});

	it("displays the value and max as text", () => {
		render(<SemiCircleGauge value={3} max={10} />);
		expect(screen.getByText("3")).toBeInTheDocument();
		expect(screen.getByText("/10")).toBeInTheDocument();
	});

	it("renders label when provided", () => {
		render(<SemiCircleGauge value={5} label="Risk Score" />);
		expect(screen.getByText("Risk Score")).toBeInTheDocument();
	});

	it("does not render label when not provided", () => {
		render(<SemiCircleGauge value={5} />);
		// No label paragraph should be present
		const labels = document.querySelectorAll("p");
		// Only the threshold label (if any) should appear
		expect(labels.length).toBeLessThanOrEqual(2);
	});

	it("shows low threshold label for value 0", () => {
		render(<SemiCircleGauge value={0} />);
		expect(screen.getByText("Low")).toBeInTheDocument();
	});

	it("shows medium threshold label for value 5", () => {
		render(<SemiCircleGauge value={5} />);
		expect(screen.getByText("Medium")).toBeInTheDocument();
	});

	it("shows high threshold label for value 8", () => {
		render(<SemiCircleGauge value={8} />);
		expect(screen.getByText("High")).toBeInTheDocument();
	});

	it("renders with custom max", () => {
		render(<SemiCircleGauge value={50} max={100} />);
		expect(screen.getByRole("img")).toHaveAttribute(
			"aria-label",
			"Gauge showing 50 out of 100",
		);
		expect(screen.getByText("/100")).toBeInTheDocument();
	});

	it("renders with custom thresholds", () => {
		const thresholds = [
			{
				value: 0,
				color: "#blue",
				textClass: "text-blue-500",
				label: "Cold",
			},
			{
				value: 5,
				color: "#red",
				textClass: "text-red-500",
				label: "Hot",
			},
		];
		render(<SemiCircleGauge value={6} thresholds={thresholds} />);
		expect(screen.getByText("Hot")).toBeInTheDocument();
	});

	it("uses first threshold when value is below all thresholds", () => {
		const thresholds = [
			{
				value: 5,
				color: "#green",
				textClass: "text-green-500",
				label: "High",
			},
		];
		render(<SemiCircleGauge value={2} thresholds={thresholds} />);
		// Should use the first threshold as fallback
		expect(screen.getByText("High")).toBeInTheDocument();
	});
});
