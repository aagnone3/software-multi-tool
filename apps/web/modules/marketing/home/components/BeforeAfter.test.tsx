import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { BeforeAfter } from "./BeforeAfter";

describe("BeforeAfter", () => {
	it("renders the section heading", () => {
		render(<BeforeAfter />);
		expect(screen.getByText(/Hours of work/i)).toBeDefined();
		expect(screen.getByText(/done in seconds/i)).toBeDefined();
	});

	it("renders column headers", () => {
		render(<BeforeAfter />);
		expect(screen.getByText(/Without AI/i)).toBeDefined();
		expect(screen.getByText(/With AI/i)).toBeDefined();
	});

	it("renders all comparison rows", () => {
		render(<BeforeAfter />);
		expect(screen.getByText(/Summarize a 1-hour meeting/i)).toBeDefined();
		expect(screen.getByText(/Process 20 invoices/i)).toBeDefined();
		expect(screen.getByText(/Review a contract/i)).toBeDefined();
		expect(
			screen.getByText(/Categorize a month of expenses/i),
		).toBeDefined();
	});

	it("renders AI time values", () => {
		render(<BeforeAfter />);
		expect(screen.getByText(/Under 30 seconds/i)).toBeDefined();
		expect(screen.getByText(/Under 5 minutes/i)).toBeDefined();
		expect(screen.getByText(/Under 60 seconds/i)).toBeDefined();
		expect(screen.getByText(/Under 2 minutes/i)).toBeDefined();
	});

	it("renders disclaimer", () => {
		render(<BeforeAfter />);
		expect(
			screen.getByText(/Based on typical small business workflows/i),
		).toBeDefined();
	});
});
