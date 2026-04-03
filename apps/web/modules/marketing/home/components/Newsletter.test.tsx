import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

const mockMutateAsync = vi.fn();
vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		newsletter: {
			subscribe: {
				mutationOptions: () => ({}),
			},
		},
	},
}));

vi.mock("@tanstack/react-query", () => ({
	useMutation: () => ({ mutateAsync: mockMutateAsync }),
}));

import { Newsletter } from "./Newsletter";

describe("Newsletter", () => {
	beforeEach(() => {
		mockTrack.mockClear();
		mockMutateAsync.mockReset();
	});

	it("renders email input and submit button", () => {
		render(<Newsletter />);
		expect(screen.getByRole("textbox")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /subscribe/i }),
		).toBeInTheDocument();
	});

	it("tracks submitted and succeeded on success", async () => {
		mockMutateAsync.mockResolvedValue({});
		render(<Newsletter />);
		fireEvent.change(screen.getByRole("textbox"), {
			target: { value: "test@example.com" },
		});
		fireEvent.click(screen.getByRole("button", { name: /subscribe/i }));
		await waitFor(() => {
			expect(mockTrack).toHaveBeenCalledWith({
				name: "newsletter_signup_submitted",
				props: { email: "test@example.com" },
			});
			expect(mockTrack).toHaveBeenCalledWith({
				name: "newsletter_signup_succeeded",
				props: { email: "test@example.com" },
			});
		});
	});

	it("tracks failed on error", async () => {
		mockMutateAsync.mockRejectedValue(new Error("fail"));
		render(<Newsletter />);
		fireEvent.change(screen.getByRole("textbox"), {
			target: { value: "test@example.com" },
		});
		fireEvent.click(screen.getByRole("button", { name: /subscribe/i }));
		await waitFor(() => {
			expect(mockTrack).toHaveBeenCalledWith({
				name: "newsletter_signup_failed",
				props: { email: "test@example.com" },
			});
		});
	});
});
