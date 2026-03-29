import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { WhoIsItFor } from "./WhoIsItFor";

describe("WhoIsItFor", () => {
	it("renders the section heading", () => {
		render(<WhoIsItFor />);
		expect(
			screen.getByText("Built for busy professionals"),
		).toBeInTheDocument();
	});

	it("renders all 8 persona cards", () => {
		render(<WhoIsItFor />);
		expect(screen.getByText("Freelancer")).toBeInTheDocument();
		expect(screen.getByText("Small Business Owner")).toBeInTheDocument();
		expect(screen.getByText("Operations Manager")).toBeInTheDocument();
		expect(screen.getByText("Finance Team")).toBeInTheDocument();
		expect(screen.getByText("Customer Success")).toBeInTheDocument();
		expect(screen.getByText("Legal / Compliance")).toBeInTheDocument();
		expect(screen.getByText("HR / Recruiting")).toBeInTheDocument();
		expect(screen.getByText("Research Analyst")).toBeInTheDocument();
	});

	it("shows strikethrough problem text", () => {
		render(<WhoIsItFor />);
		expect(
			screen.getByText("Hours spent writing meeting recap emails"),
		).toBeInTheDocument();
	});

	it("renders tool links with correct hrefs", () => {
		render(<WhoIsItFor />);
		const links = screen.getAllByRole("link");
		const meetingLink = links.find((l) =>
			l.getAttribute("href")?.includes("meeting-summarizer"),
		);
		expect(meetingLink).toBeDefined();
	});

	it("accepts a className prop", () => {
		const { container } = render(<WhoIsItFor className="test-class" />);
		expect(container.querySelector(".test-class")).toBeDefined();
	});
});
