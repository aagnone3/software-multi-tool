import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import "./tool-components-test-support";
import { ExpenseCategorizerTool } from "./ExpenseCategorizerTool";
import { createQueryWrapper } from "./tool-components-test-support";

describe("ExpenseCategorizerTool", () => {
	const wrapper = createQueryWrapper();

	it("renders the tool with heading", () => {
		render(<ExpenseCategorizerTool />, { wrapper });

		expect(screen.getByText(/expense categorizer/i)).toBeInTheDocument();
	});

	it("renders categorize expenses button", () => {
		render(<ExpenseCategorizerTool />, { wrapper });

		expect(
			screen.getByRole("button", { name: /categorize.*expenses/i }),
		).toBeInTheDocument();
	});

	it("renders file upload button", () => {
		render(<ExpenseCategorizerTool />, { wrapper });

		expect(screen.getByText(/file upload/i)).toBeInTheDocument();
	});
});
