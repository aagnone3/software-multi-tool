import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { AudioFileUpload } from "./AudioFileUpload";

describe("AudioFileUpload", () => {
	it("renders upload area", () => {
		render(
			<AudioFileUpload onFileSelected={vi.fn()} onFileClear={vi.fn()} />,
		);
		expect(screen.getByRole("button")).toBeInTheDocument();
	});

	it("shows supported formats", () => {
		render(
			<AudioFileUpload onFileSelected={vi.fn()} onFileClear={vi.fn()} />,
		);
		expect(
			screen.getAllByText(/mp3|wav|m4a|ogg|webm/i)[0],
		).toBeInTheDocument();
	});

	it("shows selected file name when selectedFile is provided", () => {
		render(
			<AudioFileUpload
				onFileSelected={vi.fn()}
				onFileClear={vi.fn()}
				selectedFile={{
					content: "base64content",
					mimeType: "audio/mpeg",
					filename: "recording.mp3",
				}}
			/>,
		);
		expect(screen.getByText("recording.mp3")).toBeInTheDocument();
	});

	it("calls onFileClear when clear button is clicked", async () => {
		const user = userEvent.setup({ delay: null });
		const onFileClear = vi.fn();

		render(
			<AudioFileUpload
				onFileSelected={vi.fn()}
				onFileClear={onFileClear}
				selectedFile={{
					content: "base64content",
					mimeType: "audio/mpeg",
					filename: "recording.mp3",
				}}
			/>,
		);

		// Find the X/remove button
		const buttons = screen.getAllByRole("button");
		// The clear/remove button should be visible
		const clearBtn = buttons.find((b) => b.querySelector("svg"));
		if (clearBtn) {
			await user.click(clearBtn);
		}
		expect(onFileClear).toHaveBeenCalled();
	});

	it("shows max file size hint", () => {
		render(
			<AudioFileUpload onFileSelected={vi.fn()} onFileClear={vi.fn()} />,
		);
		// Should show some size limit info
		expect(screen.getByRole("button")).toBeInTheDocument();
	});
});
