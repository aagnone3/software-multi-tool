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
		contact: {
			submit: {
				mutationOptions: () => ({}),
			},
		},
	},
}));

vi.mock("@tanstack/react-query", () => ({
	useMutation: () => ({ mutateAsync: mockMutateAsync }),
}));

import { ContactForm } from "./ContactForm";

describe("ContactForm", () => {
	beforeEach(() => {
		mockTrack.mockClear();
		mockMutateAsync.mockReset();
	});

	it("renders name, email, message fields and submit button", () => {
		render(<ContactForm />);
		expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
	});

	it("tracks submitted and succeeded on success", async () => {
		mockMutateAsync.mockResolvedValue({});
		render(<ContactForm />);
		fireEvent.change(screen.getByLabelText(/name/i), {
			target: { value: "Alice Smith" },
		});
		fireEvent.change(screen.getByLabelText(/email/i), {
			target: { value: "alice@example.com" },
		});
		fireEvent.change(screen.getByLabelText(/message/i), {
			target: { value: "Hello, I have a question about your product." },
		});
		fireEvent.click(screen.getByRole("button", { name: /send/i }));
		await waitFor(() => {
			expect(mockTrack).toHaveBeenCalledWith({
				name: "contact_form_submitted",
				props: { has_message: true },
			});
			expect(mockTrack).toHaveBeenCalledWith({
				name: "contact_form_succeeded",
				props: {},
			});
		});
	});

	it("tracks failed on error", async () => {
		mockMutateAsync.mockRejectedValue(new Error("fail"));
		render(<ContactForm />);
		fireEvent.change(screen.getByLabelText(/name/i), {
			target: { value: "Alice Smith" },
		});
		fireEvent.change(screen.getByLabelText(/email/i), {
			target: { value: "alice@example.com" },
		});
		fireEvent.change(screen.getByLabelText(/message/i), {
			target: { value: "Hello, I have a question about your product." },
		});
		fireEvent.click(screen.getByRole("button", { name: /send/i }));
		await waitFor(() => {
			expect(mockTrack).toHaveBeenCalledWith({
				name: "contact_form_failed",
				props: {},
			});
		});
	});
});
