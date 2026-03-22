import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { NewsAnalyzerForm } from "./news-analyzer-form";

describe("NewsAnalyzerForm", () => {
	it("renders in URL mode by default", () => {
		render(<NewsAnalyzerForm onSubmit={vi.fn()} isLoading={false} />);
		expect(screen.getByLabelText("Article URL")).toBeInTheDocument();
		expect(screen.queryByLabelText("Article Text")).not.toBeInTheDocument();
	});

	it("switches to text mode when Paste Text button is clicked", async () => {
		const user = userEvent.setup({ delay: null });
		render(<NewsAnalyzerForm onSubmit={vi.fn()} isLoading={false} />);

		await user.click(screen.getByRole("button", { name: /Paste Text/i }));

		expect(screen.getByLabelText("Article Text")).toBeInTheDocument();
		expect(screen.queryByLabelText("Article URL")).not.toBeInTheDocument();
	});

	it("calls onSubmit with articleUrl when URL mode form is submitted", async () => {
		const user = userEvent.setup({ delay: null });
		const onSubmit = vi.fn();
		render(<NewsAnalyzerForm onSubmit={onSubmit} isLoading={false} />);

		await user.type(
			screen.getByLabelText("Article URL"),
			"https://example.com/article",
		);
		await user.click(
			screen.getByRole("button", { name: /Analyze Article/i }),
		);

		expect(onSubmit).toHaveBeenCalledWith({
			articleUrl: "https://example.com/article",
		});
	});

	it("calls onSubmit with articleText when text mode form is submitted", async () => {
		const user = userEvent.setup({ delay: null });
		const onSubmit = vi.fn();
		render(<NewsAnalyzerForm onSubmit={onSubmit} isLoading={false} />);

		await user.click(screen.getByRole("button", { name: /Paste Text/i }));
		await user.type(
			screen.getByLabelText("Article Text"),
			"This is some article text that is long enough.",
		);
		await user.click(
			screen.getByRole("button", { name: /Analyze Article/i }),
		);

		expect(onSubmit).toHaveBeenCalledWith({
			articleText: "This is some article text that is long enough.",
		});
	});

	it("disables submit button when isLoading is true", () => {
		render(<NewsAnalyzerForm onSubmit={vi.fn()} isLoading={true} />);
		expect(
			screen.getByRole("button", { name: /Analyzing/i }),
		).toBeDisabled();
	});

	it("does not call onSubmit when URL is empty", async () => {
		const user = userEvent.setup({ delay: null });
		const onSubmit = vi.fn();
		render(<NewsAnalyzerForm onSubmit={onSubmit} isLoading={false} />);

		await user.click(
			screen.getByRole("button", { name: /Analyze Article/i }),
		);

		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("shows character count in text mode", async () => {
		const user = userEvent.setup({ delay: null });
		render(<NewsAnalyzerForm onSubmit={vi.fn()} isLoading={false} />);

		await user.click(screen.getByRole("button", { name: /Paste Text/i }));
		await user.type(screen.getByLabelText("Article Text"), "Hello");

		expect(screen.getByText(/5 characters/i)).toBeInTheDocument();
	});
});
