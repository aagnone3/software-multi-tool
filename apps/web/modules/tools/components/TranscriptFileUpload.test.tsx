import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { TranscriptFileUpload } from "./TranscriptFileUpload";

describe("TranscriptFileUpload", () => {
	it("renders upload area", () => {
		const onFileSelect = vi.fn();
		render(<TranscriptFileUpload onFileSelect={onFileSelect} />);
		expect(screen.getByRole("button")).toBeInTheDocument();
	});

	it("shows supported file formats", () => {
		const onFileSelect = vi.fn();
		render(<TranscriptFileUpload onFileSelect={onFileSelect} />);
		// Should show TXT, DOCX, VTT, SRT somewhere
		expect(
			screen.getAllByText(/\.txt|\.docx|\.vtt|\.srt|txt|docx/i)[0],
		).toBeInTheDocument();
	});

	it("shows selected file when value is provided", () => {
		const onFileSelect = vi.fn();
		render(
			<TranscriptFileUpload
				onFileSelect={onFileSelect}
				value={{
					content: "base64content",
					filename: "meeting-notes.txt",
				}}
			/>,
		);
		expect(screen.getByText("meeting-notes.txt")).toBeInTheDocument();
	});

	it("calls onFileSelect(null) when clear button is clicked", async () => {
		const user = userEvent.setup({ delay: null });
		const onFileSelect = vi.fn();

		render(
			<TranscriptFileUpload
				onFileSelect={onFileSelect}
				value={{
					content: "base64content",
					filename: "meeting-notes.txt",
				}}
			/>,
		);

		const clearButton = screen.getByRole("button", {
			name: /remove|clear|delete/i,
		});
		await user.click(clearButton);
		expect(onFileSelect).toHaveBeenCalledWith(null);
	});

	it("is disabled when disabled prop is true", () => {
		const onFileSelect = vi.fn();
		const { container } = render(
			<TranscriptFileUpload
				onFileSelect={onFileSelect}
				disabled={true}
			/>,
		);
		const input = container.querySelector('input[type="file"]');
		expect(input).toBeDisabled();
	});
});
