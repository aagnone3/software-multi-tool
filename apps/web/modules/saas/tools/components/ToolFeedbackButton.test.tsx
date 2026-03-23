import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToolFeedbackButton } from "./ToolFeedbackButton";

const { mockMutate, mockToastSuccess, mockToastError, mockFeedbackCreate } =
	vi.hoisted(() => ({
		mockMutate: vi.fn(),
		mockToastSuccess: vi.fn(),
		mockToastError: vi.fn(),
		mockFeedbackCreate: vi.fn().mockResolvedValue({}),
	}));

vi.mock("@tanstack/react-query", () => ({
	useMutation: vi.fn(() => ({
		mutate: mockMutate,
		isPending: false,
	})),
}));

vi.mock("sonner", () => ({
	toast: {
		success: mockToastSuccess,
		error: mockToastError,
	},
}));

vi.mock("@shared/lib/orpc-client", () => ({
	orpcClient: {
		feedback: {
			create: mockFeedbackCreate,
		},
	},
}));

describe("ToolFeedbackButton", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders feedback icon button", () => {
		render(<ToolFeedbackButton toolSlug="test-tool" />);
		expect(
			screen.getByRole("button", { name: "Give feedback on this tool" }),
		).toBeDefined();
	});

	it("opens dialog when clicked", async () => {
		render(<ToolFeedbackButton toolSlug="test-tool" />);
		const button = screen.getByRole("button", {
			name: "Give feedback on this tool",
		});
		fireEvent.click(button);
		await waitFor(() => {
			expect(screen.getByText("Rate this tool")).toBeDefined();
		});
	});

	it("shows rating buttons in dialog", async () => {
		render(<ToolFeedbackButton toolSlug="test-tool" />);
		fireEvent.click(
			screen.getByRole("button", { name: "Give feedback on this tool" }),
		);
		await waitFor(() => {
			expect(screen.getByText("Yes, great!")).toBeDefined();
			expect(screen.getByText("Needs work")).toBeDefined();
		});
	});

	it("shows comment textarea", async () => {
		render(<ToolFeedbackButton toolSlug="test-tool" />);
		fireEvent.click(
			screen.getByRole("button", { name: "Give feedback on this tool" }),
		);
		await waitFor(() => {
			expect(screen.getByRole("textbox")).toBeDefined();
		});
	});

	it("submit button is disabled without a rating", async () => {
		render(<ToolFeedbackButton toolSlug="test-tool" />);
		fireEvent.click(
			screen.getByRole("button", { name: "Give feedback on this tool" }),
		);
		await waitFor(() => {
			const submitBtn = screen.getByText("Submit feedback");
			expect(submitBtn.closest("button")).toHaveProperty(
				"disabled",
				true,
			);
		});
	});
});
