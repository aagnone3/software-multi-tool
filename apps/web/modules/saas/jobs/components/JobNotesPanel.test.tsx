import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JobNotesPanel } from "./JobNotesPanel";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		},
	};
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("JobNotesPanel", () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	it("renders with no notes initially", () => {
		render(<JobNotesPanel jobId="job-1" />);
		expect(screen.getByText(/no notes yet/i)).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /add note/i }),
		).toBeInTheDocument();
	});

	it("opens edit mode on Add note click", async () => {
		const user = userEvent.setup({ delay: null });
		render(<JobNotesPanel jobId="job-1" />);
		await user.click(screen.getByRole("button", { name: /add note/i }));
		expect(screen.getByPlaceholderText(/add a note/i)).toBeInTheDocument();
	});

	it("saves note and displays it", async () => {
		const user = userEvent.setup({ delay: null });
		render(<JobNotesPanel jobId="job-1" />);
		await user.click(screen.getByRole("button", { name: /add note/i }));
		await user.type(
			screen.getByPlaceholderText(/add a note/i),
			"Test note content",
		);
		await user.click(screen.getByRole("button", { name: /save/i }));
		await waitFor(() => {
			expect(screen.getByText("Test note content")).toBeInTheDocument();
		});
	});

	it("cancels editing without saving", async () => {
		const user = userEvent.setup({ delay: null });
		render(<JobNotesPanel jobId="job-1" />);
		await user.click(screen.getByRole("button", { name: /add note/i }));
		await user.type(screen.getByPlaceholderText(/add a note/i), "Unsaved");
		await user.click(screen.getByRole("button", { name: /cancel/i }));
		expect(screen.getByText(/no notes yet/i)).toBeInTheDocument();
	});

	it("loads existing note from localStorage", () => {
		localStorageMock.setItem("job-note:job-2", "Existing note");
		render(<JobNotesPanel jobId="job-2" />);
		expect(screen.getByText("Existing note")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /edit/i }),
		).toBeInTheDocument();
	});

	it("shows Edit button when note exists", () => {
		localStorageMock.setItem("job-note:job-3", "Some note");
		render(<JobNotesPanel jobId="job-3" />);
		expect(
			screen.getByRole("button", { name: /edit/i }),
		).toBeInTheDocument();
	});
});
