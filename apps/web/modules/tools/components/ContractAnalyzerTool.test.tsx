import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import "./tool-components-test-support";
import { ContractAnalyzerTool } from "./ContractAnalyzerTool";
import { createQueryWrapper } from "./tool-components-test-support";

describe("ContractAnalyzerTool", () => {
	const wrapper = createQueryWrapper();

	it("renders the tool with form elements", () => {
		render(<ContractAnalyzerTool />, { wrapper });

		expect(
			screen.getByRole("button", { name: /analyze/i }),
		).toBeInTheDocument();
	});

	it("renders analysis depth select", () => {
		render(<ContractAnalyzerTool />, { wrapper });

		expect(screen.getByText(/analysis depth/i)).toBeInTheDocument();
	});

	it("renders upload and paste text tabs", () => {
		render(<ContractAnalyzerTool />, { wrapper });

		expect(
			screen.getByRole("tab", { name: /upload file/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("tab", { name: /paste text/i }),
		).toBeInTheDocument();
	});
});
