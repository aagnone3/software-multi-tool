import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { StatsBar } from "./StatsBar";

describe("StatsBar", () => {
	it("renders all stats", () => {
		render(<StatsBar />);
		expect(screen.getByText("50,000+")).toBeInTheDocument();
		expect(screen.getByText("Hours Saved")).toBeInTheDocument();
		expect(screen.getByText("200,000+")).toBeInTheDocument();
		expect(screen.getByText("Documents Processed")).toBeInTheDocument();
		expect(screen.getByText("80%")).toBeInTheDocument();
		expect(screen.getByText("98.5%")).toBeInTheDocument();
	});

	it("renders stat descriptions", () => {
		render(<StatsBar />);
		expect(
			screen.getByText("Average reduction in manual processing time"),
		).toBeInTheDocument();
	});
});
