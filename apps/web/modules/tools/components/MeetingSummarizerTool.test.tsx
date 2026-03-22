import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import "./tool-components-test-support";
import { MeetingSummarizerTool } from "./MeetingSummarizerTool";
import { createQueryWrapper } from "./tool-components-test-support";

describe("MeetingSummarizerTool", () => {
	const wrapper = createQueryWrapper();

	it("renders the tool with submit button", () => {
		render(<MeetingSummarizerTool />, { wrapper });

		expect(
			screen.getByRole("button", { name: /summarize/i }),
		).toBeInTheDocument();
	});

	it("renders text input tab as default", () => {
		render(<MeetingSummarizerTool />, { wrapper });

		expect(
			screen.getByPlaceholderText(
				"Paste your meeting notes, transcript, or recording summary here...",
			),
		).toBeInTheDocument();
	});

	it("renders meeting type selector", () => {
		render(<MeetingSummarizerTool />, { wrapper });

		expect(screen.getByText(/meeting type/i)).toBeInTheDocument();
	});
});
