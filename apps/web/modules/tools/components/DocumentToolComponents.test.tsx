import "./tool-components-test-support";

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContractAnalyzerTool } from "./ContractAnalyzerTool";
import { InvoiceProcessorTool } from "./InvoiceProcessorTool";
import {
	createQueryWrapper,
	mockMutateAsync,
} from "./tool-components-test-support";

vi.mock("./DocumentUpload", () => ({
	DocumentUpload: () => <div data-testid="document-upload" />,
}));

const QueryWrapper = createQueryWrapper();

describe("InvoiceProcessorTool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the invoice processor form with tabs", () => {
		render(<InvoiceProcessorTool />, { wrapper: QueryWrapper });

		expect(screen.getByText("Invoice Processor")).toBeInTheDocument();
		expect(screen.getByText("Upload File")).toBeInTheDocument();
		expect(screen.getByText("Paste Text")).toBeInTheDocument();
		expect(screen.getByText("Output Format")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Process Invoice" }),
		).toBeInTheDocument();
	});

	it("shows validation error when no file is uploaded", () => {
		render(<InvoiceProcessorTool />, { wrapper: QueryWrapper });

		const submitButton = screen.getByRole("button", {
			name: "Process Invoice",
		});
		expect(submitButton).toBeDisabled();
	});

	it("submits form with correct tool slug using text input", async () => {
		mockMutateAsync.mockResolvedValue({ job: { id: "job-123" } });

		render(<InvoiceProcessorTool />, { wrapper: QueryWrapper });

		fireEvent.click(
			screen.getByRole("button", {
				name: /Paste Text/i,
			}),
		);

		fireEvent.change(
			await screen.findByPlaceholderText(
				"Paste your invoice text here...",
			),
			{
				target: { value: "Test invoice content" },
			},
		);

		fireEvent.click(
			screen.getByRole("button", {
				name: "Process Invoice",
			}),
		);

		expect(
			await screen.findByTestId("job-progress-indicator"),
		).toBeInTheDocument();
		expect(mockMutateAsync).toHaveBeenCalledWith({
			toolSlug: "invoice-processor",
			input: {
				invoiceText: "Test invoice content",
				outputFormat: "json",
			},
		});
	});

	it("shows upload tab by default", () => {
		render(<InvoiceProcessorTool />, { wrapper: QueryWrapper });

		expect(
			screen.getByText(/Drag & drop an invoice file/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Supports: PDF, JPG, PNG, TIFF, WebP/i),
		).toBeInTheDocument();
	});
});

describe("ContractAnalyzerTool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the contract analyzer form with tabs", () => {
		render(<ContractAnalyzerTool />, { wrapper: QueryWrapper });

		expect(screen.getByText("Contract Analyzer")).toBeInTheDocument();
		expect(screen.getByText("Upload File")).toBeInTheDocument();
		expect(screen.getByText("Paste Text")).toBeInTheDocument();
		expect(screen.getByText("Analysis Depth")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Analyze Contract" }),
		).toBeInTheDocument();
	});

	it("shows validation error when no file or text is provided", async () => {
		render(<ContractAnalyzerTool />, { wrapper: QueryWrapper });

		fireEvent.click(
			screen.getByRole("button", {
				name: "Analyze Contract",
			}),
		);

		expect(
			await screen.findByText(
				"Either paste contract text or upload a file",
			),
		).toBeInTheDocument();
	});

	it("submits form with correct tool slug using text input", async () => {
		mockMutateAsync.mockResolvedValue({ job: { id: "job-456" } });

		render(<ContractAnalyzerTool />, { wrapper: QueryWrapper });

		const pasteTextTab = screen.getByRole("tab", { name: /Paste Text/i });
		fireEvent.mouseDown(pasteTextTab);
		fireEvent.click(pasteTextTab);

		fireEvent.change(
			await screen.findByPlaceholderText(
				"Paste your contract text here...",
			),
			{
				target: { value: "Test contract content" },
			},
		);

		fireEvent.click(
			screen.getByRole("button", {
				name: "Analyze Contract",
			}),
		);

		expect(
			await screen.findByTestId("job-progress-indicator"),
		).toBeInTheDocument();
		expect(mockMutateAsync).toHaveBeenCalledWith({
			toolSlug: "contract-analyzer",
			input: {
				contractText: "Test contract content",
				fileData: undefined,
				analysisDepth: "standard",
			},
		});
	});

	it("shows upload tab by default", () => {
		render(<ContractAnalyzerTool />, { wrapper: QueryWrapper });

		expect(screen.getByText("Upload Contract")).toBeInTheDocument();
		expect(
			screen.getByText(/Upload a PDF, Word document, or text file/i),
		).toBeInTheDocument();
	});
});
