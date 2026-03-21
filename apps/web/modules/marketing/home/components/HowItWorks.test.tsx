import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { HowItWorks } from "./HowItWorks";

describe("HowItWorks", () => {
	it("renders the section heading", () => {
		render(<HowItWorks />);
		expect(screen.getByText("How it works")).toBeInTheDocument();
	});

	it("renders all 4 steps", () => {
		render(<HowItWorks />);
		expect(screen.getByText("Sign up for free")).toBeInTheDocument();
		expect(screen.getByText("Explore the tools")).toBeInTheDocument();
		expect(screen.getByText("Chat with AI")).toBeInTheDocument();
		expect(screen.getByText("Scale as you grow")).toBeInTheDocument();
	});

	it("renders step numbers 1–4", () => {
		render(<HowItWorks />);
		for (const n of ["1", "2", "3", "4"]) {
			expect(screen.getByText(n)).toBeInTheDocument();
		}
	});
});
