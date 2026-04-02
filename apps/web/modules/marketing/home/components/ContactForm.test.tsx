import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContactForm } from "./ContactForm";

const { mockMutateAsync, mockTrack } = vi.hoisted(() => ({
	mockMutateAsync: vi.fn(),
	mockTrack: vi.fn(),
}));

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		contact: {
			submit: {
				mutationOptions: vi.fn(() => ({ mutationFn: mockMutateAsync })),
			},
		},
	},
}));

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

function renderContactForm() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return render(
		<QueryClientProvider client={queryClient}>
			<ContactForm />
		</QueryClientProvider>,
	);
}

describe("ContactForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders form fields", () => {
		renderContactForm();
		expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /send message/i }),
		).toBeInTheDocument();
	});

	it("shows success state after successful submission", async () => {
		mockMutateAsync.mockResolvedValueOnce({});
		renderContactForm();

		await userEvent.type(screen.getByLabelText(/name/i), "John Doe");
		await userEvent.type(
			screen.getByLabelText(/email/i),
			"john@example.com",
		);
		await userEvent.type(screen.getByLabelText(/message/i), "Hello there!");
		await userEvent.click(
			screen.getByRole("button", { name: /send message/i }),
		);

		await waitFor(() => {
			expect(
				screen.getByText(/message has been sent successfully/i),
			).toBeInTheDocument();
		});
	});

	it("tracks contact_form_submitted on successful submission", async () => {
		mockMutateAsync.mockResolvedValueOnce({});
		renderContactForm();

		await userEvent.type(screen.getByLabelText(/name/i), "Jane");
		await userEvent.type(
			screen.getByLabelText(/email/i),
			"jane@example.com",
		);
		await userEvent.type(screen.getByLabelText(/message/i), "Hello there!");
		await userEvent.click(
			screen.getByRole("button", { name: /send message/i }),
		);

		await waitFor(() => {
			expect(mockTrack).toHaveBeenCalledWith({
				name: "contact_form_submitted",
				props: {},
			});
		});
	});

	it("shows error message on failed submission", async () => {
		mockMutateAsync.mockRejectedValueOnce(new Error("Network error"));
		renderContactForm();

		await userEvent.type(screen.getByLabelText(/name/i), "John Doe");
		await userEvent.type(
			screen.getByLabelText(/email/i),
			"john@example.com",
		);
		await userEvent.type(screen.getByLabelText(/message/i), "Hello there!");
		await userEvent.click(
			screen.getByRole("button", { name: /send message/i }),
		);

		await waitFor(() => {
			expect(
				screen.getByText(/unable to send your message/i),
			).toBeInTheDocument();
		});
	});
});
