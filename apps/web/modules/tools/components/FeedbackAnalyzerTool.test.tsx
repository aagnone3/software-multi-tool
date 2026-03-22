import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import "./tool-components-test-support";
import { FeedbackAnalyzerTool } from "./FeedbackAnalyzerTool";
import { createQueryWrapper } from "./tool-components-test-support";

describe("FeedbackAnalyzerTool", () => {
	const wrapper = createQueryWrapper();

	it("renders the tool with heading", () => {
		render(<FeedbackAnalyzerTool />, { wrapper });

		expect(screen.getByText(/feedback analyzer/i)).toBeInTheDocument();
	});

	it("renders analyze feedback button", () => {
		render(<FeedbackAnalyzerTool />, { wrapper });

		expect(
			screen.getByRole("button", { name: /analyze feedback/i }),
		).toBeInTheDocument();
	});

	it("renders analysis type select", () => {
		render(<FeedbackAnalyzerTool />, { wrapper });

		expect(screen.getByText(/analysis type/i)).toBeInTheDocument();
	});
});
