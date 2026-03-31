import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import "./tool-components-test-support";
import { ExpenseCategorizerTool } from "./ExpenseCategorizerTool";
import {
	createQueryWrapper,
	mockMutateAsync,
} from "./tool-components-test-support";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

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

	it("shows toast error when job submission fails", async () => {
		const { toast } = await import("sonner");
		mockMutateAsync.mockRejectedValueOnce(new Error("Network error"));
		const { container } = render(<ExpenseCategorizerTool />, { wrapper });

		// Fill in description
		const descriptionInput =
			screen.getByPlaceholderText(/office supplies/i);
		await userEvent.type(descriptionInput, "Office lunch");

		// The amount input is a number input with custom onChange — use fireEvent to set valueAsNumber.
		const amountInput = screen.getByPlaceholderText(/0\.00/i);
		fireEvent.change(amountInput, { target: { value: "50" } });

		// Submit the form directly to bypass any button-click propagation issues.
		const form = container.querySelector("form");
		fireEvent.submit(form!);

		await waitFor(
			() => {
				expect(toast.error).toHaveBeenCalledWith(
					"Failed to submit job. Please try again.",
				);
			},
			{ timeout: 5000 },
		);
	}, 15000);
});
