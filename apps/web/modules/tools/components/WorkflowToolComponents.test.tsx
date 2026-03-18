import "./tool-components-test-support";

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExpenseCategorizerTool } from "./ExpenseCategorizerTool";
import { FeedbackAnalyzerTool } from "./FeedbackAnalyzerTool";
import { MeetingSummarizerTool } from "./MeetingSummarizerTool";
import { SpeakerSeparationTool } from "./SpeakerSeparationTool";
import {
	createQueryWrapper,
	mockMutateAsync,
} from "./tool-components-test-support";

vi.mock("./TranscriptFileUpload", () => ({
	TranscriptFileUpload: () => <div data-testid="transcript-file-upload" />,
}));

vi.mock("./AudioFileUpload", () => ({
	AudioFileUpload: () => <div data-testid="audio-file-upload" />,
}));

const QueryWrapper = createQueryWrapper();

describe("FeedbackAnalyzerTool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the feedback analyzer form", () => {
		render(<FeedbackAnalyzerTool />, { wrapper: QueryWrapper });

		expect(screen.getByText("Feedback Analyzer")).toBeInTheDocument();
		expect(screen.getByText("Customer Feedback")).toBeInTheDocument();
		expect(screen.getByText("Analysis Type")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Analyze Feedback" }),
		).toBeInTheDocument();
	});

	it("shows validation error when feedback text is empty", async () => {
		render(<FeedbackAnalyzerTool />, { wrapper: QueryWrapper });

		fireEvent.click(
			screen.getByRole("button", {
				name: "Analyze Feedback",
			}),
		);

		expect(
			await screen.findByText("Feedback text is required"),
		).toBeInTheDocument();
	});

	it("submits form with correct tool slug", async () => {
		mockMutateAsync.mockResolvedValue({ job: { id: "job-789" } });

		render(<FeedbackAnalyzerTool />, { wrapper: QueryWrapper });

		const textarea = screen.getByPlaceholderText(
			"Paste customer feedback, reviews, or survey responses here...",
		);
		fireEvent.change(textarea, {
			target: { value: "Customer feedback content" },
		});

		const submitButton = screen.getByRole("button", {
			name: "Analyze Feedback",
		});
		fireEvent.click(submitButton);

		expect(
			await screen.findByTestId("job-progress-indicator"),
		).toBeInTheDocument();
		expect(mockMutateAsync).toHaveBeenCalledWith({
			toolSlug: "feedback-analyzer",
			input: expect.objectContaining({
				feedback: "Customer feedback content",
				analysisType: "individual",
			}),
		});
	});
});

describe("ExpenseCategorizerTool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the expense categorizer form", () => {
		render(<ExpenseCategorizerTool />, { wrapper: QueryWrapper });

		expect(screen.getByText("Expense Categorizer")).toBeInTheDocument();
		expect(screen.getByText("Description")).toBeInTheDocument();
		expect(screen.getByText("Amount")).toBeInTheDocument();
		expect(screen.getByText("Country")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Categorize Expenses" }),
		).toBeInTheDocument();
	});

	it("can add and remove expense items", async () => {
		render(<ExpenseCategorizerTool />, { wrapper: QueryWrapper });

		const initialInputs = screen.getAllByPlaceholderText("Office supplies");
		expect(initialInputs).toHaveLength(1);

		const addButton = screen.getByRole("button", { name: /Add Expense/i });
		fireEvent.click(addButton);

		expect(
			await screen.findAllByPlaceholderText("Office supplies"),
		).toHaveLength(2);
	});

	it("validates form fields before submission", async () => {
		render(<ExpenseCategorizerTool />, { wrapper: QueryWrapper });

		const submitButton = screen.getByRole("button", {
			name: "Categorize Expenses",
		});
		fireEvent.click(submitButton);

		expect(
			await screen.findByText("Description is required"),
		).toBeInTheDocument();
	});

	it("switches between form and bulk text mode", async () => {
		render(<ExpenseCategorizerTool />, { wrapper: QueryWrapper });

		expect(
			screen.getByPlaceholderText("Office supplies"),
		).toBeInTheDocument();

		const bulkTextButton = screen.getByRole("button", {
			name: "Bulk Text",
		});
		fireEvent.click(bulkTextButton);

		expect(await screen.findByText("Paste Expenses")).toBeInTheDocument();
	});
});

describe("MeetingSummarizerTool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the meeting summarizer form", () => {
		render(<MeetingSummarizerTool />, { wrapper: QueryWrapper });

		expect(screen.getByText("Meeting Summarizer")).toBeInTheDocument();
		expect(screen.getByText("Meeting Transcript")).toBeInTheDocument();
		expect(screen.getByText("Meeting Type")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Summarize Meeting" }),
		).toBeInTheDocument();
	});

	it("shows validation error when meeting notes are empty", async () => {
		render(<MeetingSummarizerTool />, { wrapper: QueryWrapper });

		const submitButton = screen.getByRole("button", {
			name: "Summarize Meeting",
		});
		fireEvent.click(submitButton);

		expect(
			await screen.findByText(
				"Please provide meeting notes or upload a transcript file",
			),
		).toBeInTheDocument();
	});

	it("submits form with correct tool slug", async () => {
		mockMutateAsync.mockResolvedValue({ job: { id: "job-202" } });

		render(<MeetingSummarizerTool />, { wrapper: QueryWrapper });

		const textarea = screen.getByPlaceholderText(
			"Paste your meeting notes, transcript, or recording summary here...",
		);
		fireEvent.change(textarea, {
			target: { value: "Meeting notes content" },
		});

		const submitButton = screen.getByRole("button", {
			name: "Summarize Meeting",
		});
		fireEvent.click(submitButton);

		expect(
			await screen.findByTestId("job-progress-indicator"),
		).toBeInTheDocument();
		expect(mockMutateAsync).toHaveBeenCalledWith({
			toolSlug: "meeting-summarizer",
			input: expect.objectContaining({
				meetingNotes: "Meeting notes content",
				meetingType: "general",
			}),
		});
	});

	it("shows optional fields", () => {
		render(<MeetingSummarizerTool />, { wrapper: QueryWrapper });

		expect(screen.getByText("Participants (Optional)")).toBeInTheDocument();
		expect(screen.getByText("Meeting Date (Optional)")).toBeInTheDocument();
		expect(
			screen.getByText("Project Context (Optional)"),
		).toBeInTheDocument();
	});
});

describe("SpeakerSeparationTool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the speaker separation form", () => {
		render(<SpeakerSeparationTool />, { wrapper: QueryWrapper });

		expect(screen.getByText("Speaker Separation")).toBeInTheDocument();
		expect(screen.getByText("Audio File")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Analyze Speakers/i }),
		).toBeInTheDocument();
	});

	it("displays correct description", () => {
		render(<SpeakerSeparationTool />, { wrapper: QueryWrapper });

		expect(
			screen.getByText(
				/Analyze audio to identify different speakers with transcripts and timestamps/i,
			),
		).toBeInTheDocument();
	});

	it("shows file upload instructions", () => {
		render(<SpeakerSeparationTool />, { wrapper: QueryWrapper });

		expect(
			screen.getByText(/Upload an audio file.*up to 100MB/i),
		).toBeInTheDocument();
	});

	it("has submit button disabled when no file is selected", () => {
		render(<SpeakerSeparationTool />, { wrapper: QueryWrapper });

		const submitButton = screen.getByRole("button", {
			name: /Analyze Speakers/i,
		});
		expect(submitButton).toBeDisabled();
	});
});
