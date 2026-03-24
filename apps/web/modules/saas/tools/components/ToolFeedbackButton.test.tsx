import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ToolFeedbackButton } from "./ToolFeedbackButton";

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));
vi.mock("@shared/lib/orpc-client", () => ({
	orpcClient: {
		feedback: {
			create: mockCreate,
		},
	},
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("ToolFeedbackButton", () => {
	it("renders Feedback button", () => {
		render(<ToolFeedbackButton toolSlug="invoice-processor" />);
		expect(screen.getByRole("button", { name: /feedback/i })).toBeTruthy();
	});

	it("opens dialog on click", async () => {
		const user = userEvent.setup({ delay: null });
		render(<ToolFeedbackButton toolSlug="invoice-processor" />);
		await user.click(screen.getByRole("button", { name: /feedback/i }));
		expect(screen.getByText("Share your feedback")).toBeTruthy();
		expect(screen.getByText("Helpful")).toBeTruthy();
		expect(screen.getByText("Not helpful")).toBeTruthy();
	});

	it("submit is disabled until rating is chosen", async () => {
		const user = userEvent.setup({ delay: null });
		render(<ToolFeedbackButton toolSlug="invoice-processor" />);
		await user.click(screen.getByRole("button", { name: /feedback/i }));
		const submitBtn = screen.getByRole("button", {
			name: /submit feedback/i,
		});
		expect((submitBtn as HTMLButtonElement).disabled).toBe(true);
	});

	it("submits feedback with POSITIVE rating", async () => {
		const user = userEvent.setup({ delay: null });
		mockCreate.mockResolvedValueOnce({ feedback: { id: "f1" } });
		render(
			<ToolFeedbackButton toolSlug="invoice-processor" jobId="job-1" />,
		);
		await user.click(screen.getByRole("button", { name: /feedback/i }));
		await user.click(screen.getByText("Helpful"));
		await user.click(
			screen.getByRole("button", { name: /submit feedback/i }),
		);
		await waitFor(() =>
			expect(mockCreate).toHaveBeenCalledWith({
				toolSlug: "invoice-processor",
				rating: "POSITIVE",
				jobId: "job-1",
				chatTranscript: undefined,
			}),
		);
	});

	it("shows error toast on failure", async () => {
		const user = userEvent.setup({ delay: null });
		const { toast } = await import("sonner");
		mockCreate.mockRejectedValueOnce(new Error("fail"));
		render(<ToolFeedbackButton toolSlug="invoice-processor" />);
		await user.click(screen.getByRole("button", { name: /feedback/i }));
		await user.click(screen.getByText("Not helpful"));
		await user.click(
			screen.getByRole("button", { name: /submit feedback/i }),
		);
		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith(
				"Failed to submit feedback. Please try again.",
			),
		);
	});
});
