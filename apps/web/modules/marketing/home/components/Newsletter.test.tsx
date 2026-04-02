import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Newsletter } from "./Newsletter";

const { mockMutateAsync, mockTrack } = vi.hoisted(() => ({
	mockMutateAsync: vi.fn(),
	mockTrack: vi.fn(),
}));

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		newsletter: {
			subscribe: {
				mutationOptions: vi.fn(() => ({ mutationFn: mockMutateAsync })),
			},
		},
	},
}));

vi.mock("sonner", () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

function renderNewsletter() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return render(
		<QueryClientProvider client={queryClient}>
			<Newsletter />
		</QueryClientProvider>,
	);
}

describe("Newsletter", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the newsletter form", () => {
		renderNewsletter();
		expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /subscribe/i }),
		).toBeInTheDocument();
	});

	it("shows success state after successful subscription", async () => {
		mockMutateAsync.mockResolvedValueOnce({});
		renderNewsletter();

		await userEvent.type(
			screen.getByPlaceholderText("Email"),
			"user@example.com",
		);
		await userEvent.click(
			screen.getByRole("button", { name: /subscribe/i }),
		);

		await waitFor(() => {
			expect(screen.getByText(/subscribed/i)).toBeInTheDocument();
		});
	});

	it("tracks newsletter_subscribed on successful subscription", async () => {
		mockMutateAsync.mockResolvedValueOnce({});
		renderNewsletter();

		await userEvent.type(
			screen.getByPlaceholderText("Email"),
			"user@example.com",
		);
		await userEvent.click(
			screen.getByRole("button", { name: /subscribe/i }),
		);

		await waitFor(() => {
			expect(mockTrack).toHaveBeenCalledWith({
				name: "newsletter_subscribed",
				props: { source: "marketing_page" },
			});
		});
	});

	it("shows error message on failed subscription", async () => {
		mockMutateAsync.mockRejectedValueOnce(new Error("Network error"));
		renderNewsletter();

		await userEvent.type(
			screen.getByPlaceholderText("Email"),
			"user@example.com",
		);
		await userEvent.click(
			screen.getByRole("button", { name: /subscribe/i }),
		);

		await waitFor(() => {
			expect(
				screen.getByText(/could not subscribe/i),
			).toBeInTheDocument();
		});
	});
});
