import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import "./tool-components-test-support";
import { InvoiceProcessorTool } from "./InvoiceProcessorTool";
import { createQueryWrapper } from "./tool-components-test-support";

describe("InvoiceProcessorTool", () => {
	const wrapper = createQueryWrapper();

	it("renders the tool with heading", () => {
		render(<InvoiceProcessorTool />, { wrapper });

		expect(screen.getByText(/invoice processor/i)).toBeInTheDocument();
	});

	it("renders process invoice button", () => {
		render(<InvoiceProcessorTool />, { wrapper });

		expect(
			screen.getByRole("button", { name: /process invoice/i }),
		).toBeInTheDocument();
	});

	it("renders input mode tabs", () => {
		render(<InvoiceProcessorTool />, { wrapper });

		expect(
			screen.getByRole("button", { name: /upload file/i }),
		).toBeInTheDocument();
	});
});
