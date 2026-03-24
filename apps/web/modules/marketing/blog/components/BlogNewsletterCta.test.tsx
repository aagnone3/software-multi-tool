import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BlogNewsletterCta } from "./BlogNewsletterCta";

describe("BlogNewsletterCta", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("renders heading and email input", () => {
		render(<BlogNewsletterCta />);
		expect(screen.getByText(/get weekly ai tips/i)).toBeTruthy();
		expect(screen.getByPlaceholderText("your@email.com")).toBeTruthy();
		expect(screen.getByRole("button", { name: /subscribe/i })).toBeTruthy();
	});

	it("shows success message on successful submit", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));

		render(<BlogNewsletterCta />);
		const input = screen.getByPlaceholderText("your@email.com");
		const button = screen.getByRole("button", { name: /subscribe/i });

		fireEvent.change(input, { target: { value: "test@example.com" } });
		fireEvent.click(button);

		await waitFor(() => {
			expect(screen.getByText(/you're in/i)).toBeTruthy();
		});
	});

	it("shows error message on failed submit", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

		render(<BlogNewsletterCta />);
		const input = screen.getByPlaceholderText("your@email.com");
		fireEvent.change(input, { target: { value: "test@example.com" } });
		fireEvent.click(screen.getByRole("button", { name: /subscribe/i }));

		await waitFor(() => {
			expect(screen.getByText(/something went wrong/i)).toBeTruthy();
		});
	});

	it("shows error on fetch exception", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockRejectedValue(new Error("network error")),
		);

		render(<BlogNewsletterCta />);
		const input = screen.getByPlaceholderText("your@email.com");
		fireEvent.change(input, { target: { value: "test@example.com" } });
		fireEvent.click(screen.getByRole("button", { name: /subscribe/i }));

		await waitFor(() => {
			expect(screen.getByText(/something went wrong/i)).toBeTruthy();
		});
	});
});
