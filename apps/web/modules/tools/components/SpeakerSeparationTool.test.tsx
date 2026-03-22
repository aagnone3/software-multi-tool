import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import "./tool-components-test-support";
import { SpeakerSeparationTool } from "./SpeakerSeparationTool";
import { createQueryWrapper } from "./tool-components-test-support";

describe("SpeakerSeparationTool", () => {
	const wrapper = createQueryWrapper();

	it("renders the tool with heading", () => {
		render(<SpeakerSeparationTool />, { wrapper });

		expect(screen.getByText(/speaker separation/i)).toBeInTheDocument();
	});

	it("renders audio file label", () => {
		render(<SpeakerSeparationTool />, { wrapper });

		expect(screen.getAllByText(/audio file/i).length).toBeGreaterThan(0);
	});

	it("renders analyze speakers button", () => {
		render(<SpeakerSeparationTool />, { wrapper });

		expect(
			screen.getByRole("button", { name: /analyze speakers/i }),
		).toBeInTheDocument();
	});
});
