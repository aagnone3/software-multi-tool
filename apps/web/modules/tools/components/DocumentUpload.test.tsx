import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { DocumentUpload } from "./DocumentUpload";

describe("DocumentUpload", () => {
	it("renders upload area with label text", () => {
		const onFileSelected = vi.fn();
		const onFileClear = vi.fn();

		render(
			<DocumentUpload
				onFileSelected={onFileSelected}
				onFileClear={onFileClear}
			/>,
		);

		expect(
			screen.getAllByText(/drag and drop|click to upload|upload/i)[0],
		).toBeInTheDocument();
	});

	it("shows selected file when selectedFile is provided", () => {
		const onFileSelected = vi.fn();
		const onFileClear = vi.fn();

		render(
			<DocumentUpload
				onFileSelected={onFileSelected}
				onFileClear={onFileClear}
				selectedFile={{
					content: "base64content",
					mimeType: "application/pdf",
					filename: "contract.pdf",
				}}
			/>,
		);

		expect(screen.getByText("contract.pdf")).toBeInTheDocument();
	});

	it("calls onFileClear when clear button is clicked", async () => {
		const user = userEvent.setup({ delay: null });
		const onFileSelected = vi.fn();
		const onFileClear = vi.fn();

		render(
			<DocumentUpload
				onFileSelected={onFileSelected}
				onFileClear={onFileClear}
				selectedFile={{
					content: "base64content",
					mimeType: "application/pdf",
					filename: "contract.pdf",
				}}
			/>,
		);

		const clearButton = screen.getByRole("button");
		await user.click(clearButton);
		expect(onFileClear).toHaveBeenCalled();
	});

	it("is disabled when disabled prop is true", () => {
		const onFileSelected = vi.fn();
		const onFileClear = vi.fn();

		const { container } = render(
			<DocumentUpload
				onFileSelected={onFileSelected}
				onFileClear={onFileClear}
				disabled={true}
			/>,
		);

		// The input should be disabled
		const input = container.querySelector('input[type="file"]');
		expect(input).toBeDisabled();
	});

	it("shows supported file types", () => {
		const onFileSelected = vi.fn();
		const onFileClear = vi.fn();

		render(
			<DocumentUpload
				onFileSelected={onFileSelected}
				onFileClear={onFileClear}
			/>,
		);

		// Should show PDF, DOCX, or TXT somewhere
		expect(
			screen.getByText(/PDF|DOCX|TXT|pdf|docx|txt/i),
		).toBeInTheDocument();
	});
});
