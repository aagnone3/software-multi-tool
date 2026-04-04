import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import "./tool-components-test-support";
import { ContractAnalyzerTool } from "./ContractAnalyzerTool";
import {
	createQueryWrapper,
	mockMutateAsync,
	mockTrack,
} from "./tool-components-test-support";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

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

	it("tracks tool_job_submitted on successful submission", async () => {
		mockMutateAsync.mockResolvedValueOnce({ job: { id: "job-123" } });
		render(<ContractAnalyzerTool />, { wrapper });

		const pasteTab = screen.getByRole("tab", { name: /paste text/i });
		await userEvent.click(pasteTab);

		const textarea = screen.getByRole("textbox");
		await userEvent.type(textarea, "Contract text for testing analytics");

		const submitBtn = screen.getByRole("button", { name: /analyze/i });
		await userEvent.click(submitBtn);

		expect(mockTrack).toHaveBeenCalledWith({
			name: "tool_job_submitted",
			props: { tool_slug: "contract-analyzer" },
		});
	});

	it("shows toast error when job submission fails", async () => {
		const { toast } = await import("sonner");
		mockMutateAsync.mockRejectedValueOnce(new Error("Network error"));
		render(<ContractAnalyzerTool />, { wrapper });

		const pasteTab = screen.getByRole("tab", { name: /paste text/i });
		await userEvent.click(pasteTab);

		const textarea = screen.getByRole("textbox");
		await userEvent.type(textarea, "Contract text for testing");

		const submitBtn = screen.getByRole("button", { name: /analyze/i });
		await userEvent.click(submitBtn);

		expect(toast.error).toHaveBeenCalledWith(
			"Failed to submit job. Please try again.",
		);
	});
});
