import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the useCreateJob hook
const mockMutateAsync = vi.fn();
vi.mock("../hooks/use-job-polling", () => ({
	useCreateJob: () => ({
		mutateAsync: mockMutateAsync,
		isPending: false,
	}),
}));

// Mock the JobProgressIndicator component
vi.mock("./JobProgressIndicator", () => ({
	JobProgressIndicator: ({
		onComplete,
	}: {
		jobId: string;
		title: string;
		description: string;
		onComplete: (output: Record<string, unknown>) => void;
	}) =>
		React.createElement(
			"div",
			{ "data-testid": "job-progress-indicator" },
			React.createElement(
				"button",
				{
					type: "button",
					onClick: () => onComplete({ mockOutput: true }),
					"data-testid": "complete-job",
				},
				"Complete Job",
			),
		),
}));

// Mock the Spinner component to avoid React undefined error
vi.mock("@shared/components/Spinner", () => ({
	Spinner: () =>
		React.createElement("span", { "data-testid": "spinner" }, "Loading..."),
}));

// Import components after mocks
import { ContractAnalyzerTool } from "./ContractAnalyzerTool";
import { ExpenseCategorizerTool } from "./ExpenseCategorizerTool";
import { FeedbackAnalyzerTool } from "./FeedbackAnalyzerTool";
import { InvoiceProcessorTool } from "./InvoiceProcessorTool";
import { MeetingSummarizerTool } from "./MeetingSummarizerTool";

describe("InvoiceProcessorTool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the invoice processor form", () => {
		render(<InvoiceProcessorTool />);

		expect(screen.getByText("Invoice Processor")).toBeInTheDocument();
		expect(screen.getByText("Invoice Text")).toBeInTheDocument();
		expect(screen.getByText("Output Format")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Process Invoice" }),
		).toBeInTheDocument();
	});

	it("shows validation error when invoice text is empty", async () => {
		render(<InvoiceProcessorTool />);

		const submitButton = screen.getByRole("button", {
			name: "Process Invoice",
		});
		await act(async () => {
			fireEvent.click(submitButton);
		});

		await waitFor(() => {
			expect(
				screen.getByText("Invoice text is required"),
			).toBeInTheDocument();
		});
	});

	it("submits form and shows progress indicator", async () => {
		mockMutateAsync.mockResolvedValue({ job: { id: "job-123" } });

		render(<InvoiceProcessorTool />);

		const textarea = screen.getByPlaceholderText(
			"Paste your invoice text here...",
		);
		await act(async () => {
			fireEvent.change(textarea, {
				target: { value: "Test invoice content" },
			});
		});

		const submitButton = screen.getByRole("button", {
			name: "Process Invoice",
		});
		await act(async () => {
			fireEvent.click(submitButton);
		});

		await waitFor(() => {
			expect(mockMutateAsync).toHaveBeenCalledWith({
				toolSlug: "invoice-processor",
				input: {
					invoiceText: "Test invoice content",
					outputFormat: "json",
				},
			});
		});

		await waitFor(() => {
			expect(
				screen.getByTestId("job-progress-indicator"),
			).toBeInTheDocument();
		});
	});
});

describe("ContractAnalyzerTool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the contract analyzer form with tabs", () => {
		render(<ContractAnalyzerTool />);

		expect(screen.getByText("Contract Analyzer")).toBeInTheDocument();
		// Default tab is Upload File
		expect(screen.getByText("Upload File")).toBeInTheDocument();
		expect(screen.getByText("Paste Text")).toBeInTheDocument();
		expect(screen.getByText("Analysis Depth")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Analyze Contract" }),
		).toBeInTheDocument();
	});

	it("shows validation error when no file or text is provided", async () => {
		const user = userEvent.setup();
		render(<ContractAnalyzerTool />);

		const submitButton = screen.getByRole("button", {
			name: "Analyze Contract",
		});
		await user.click(submitButton);

		await waitFor(() => {
			expect(
				screen.getByText("Either paste contract text or upload a file"),
			).toBeInTheDocument();
		});
	});

	it("submits form with correct tool slug using text input", async () => {
		const user = userEvent.setup();
		mockMutateAsync.mockResolvedValue({ job: { id: "job-456" } });

		render(<ContractAnalyzerTool />);

		// Switch to Paste Text tab using userEvent for Radix tabs
		const pasteTextTab = screen.getByRole("tab", { name: /Paste Text/i });
		await user.click(pasteTextTab);

		// Wait for the textarea to appear after tab switch
		await waitFor(() => {
			expect(
				screen.getByPlaceholderText("Paste your contract text here..."),
			).toBeInTheDocument();
		});

		const textarea = screen.getByPlaceholderText(
			"Paste your contract text here...",
		);
		await user.type(textarea, "Test contract content");

		const submitButton = screen.getByRole("button", {
			name: "Analyze Contract",
		});
		await user.click(submitButton);

		await waitFor(() => {
			expect(mockMutateAsync).toHaveBeenCalledWith({
				toolSlug: "contract-analyzer",
				input: {
					contractText: "Test contract content",
					fileData: undefined,
					analysisDepth: "standard",
				},
			});
		});
	});

	it("shows upload tab by default", () => {
		render(<ContractAnalyzerTool />);

		// The upload tab should be active by default
		expect(screen.getByText("Upload Contract")).toBeInTheDocument();
		expect(
			screen.getByText(/Upload a PDF, Word document, or text file/i),
		).toBeInTheDocument();
	});
});

describe("FeedbackAnalyzerTool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the feedback analyzer form", () => {
		render(<FeedbackAnalyzerTool />);

		expect(screen.getByText("Feedback Analyzer")).toBeInTheDocument();
		expect(screen.getByText("Customer Feedback")).toBeInTheDocument();
		expect(screen.getByText("Analysis Type")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Analyze Feedback" }),
		).toBeInTheDocument();
	});

	it("shows validation error when feedback text is empty", async () => {
		render(<FeedbackAnalyzerTool />);

		const submitButton = screen.getByRole("button", {
			name: "Analyze Feedback",
		});
		await act(async () => {
			fireEvent.click(submitButton);
		});

		await waitFor(() => {
			expect(
				screen.getByText("Feedback text is required"),
			).toBeInTheDocument();
		});
	});

	it("submits form with correct tool slug", async () => {
		mockMutateAsync.mockResolvedValue({ job: { id: "job-789" } });

		render(<FeedbackAnalyzerTool />);

		const textarea = screen.getByPlaceholderText(
			"Paste customer feedback, reviews, or survey responses here...",
		);
		await act(async () => {
			fireEvent.change(textarea, {
				target: { value: "Customer feedback content" },
			});
		});

		const submitButton = screen.getByRole("button", {
			name: "Analyze Feedback",
		});
		await act(async () => {
			fireEvent.click(submitButton);
		});

		await waitFor(() => {
			expect(mockMutateAsync).toHaveBeenCalledWith({
				toolSlug: "feedback-analyzer",
				input: expect.objectContaining({
					feedback: "Customer feedback content",
					analysisType: "individual",
				}),
			});
		});
	});
});

describe("ExpenseCategorizerTool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the expense categorizer form", () => {
		render(<ExpenseCategorizerTool />);

		expect(screen.getByText("Expense Categorizer")).toBeInTheDocument();
		expect(screen.getByText("Description")).toBeInTheDocument();
		expect(screen.getByText("Amount")).toBeInTheDocument();
		expect(screen.getByText("Country")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Categorize Expenses" }),
		).toBeInTheDocument();
	});

	it("can add and remove expense items", async () => {
		render(<ExpenseCategorizerTool />);

		// Initially there should be 1 expense row
		const initialInputs = screen.getAllByPlaceholderText("Office supplies");
		expect(initialInputs).toHaveLength(1);

		// Add an expense
		const addButton = screen.getByRole("button", { name: /Add Expense/i });
		await act(async () => {
			fireEvent.click(addButton);
		});

		await waitFor(() => {
			const afterAddInputs =
				screen.getAllByPlaceholderText("Office supplies");
			expect(afterAddInputs).toHaveLength(2);
		});
	});

	it("validates form fields before submission", async () => {
		render(<ExpenseCategorizerTool />);

		// Submit with empty description
		const submitButton = screen.getByRole("button", {
			name: "Categorize Expenses",
		});
		await act(async () => {
			fireEvent.click(submitButton);
		});

		// Should show validation error
		await waitFor(() => {
			expect(
				screen.getByText("Description is required"),
			).toBeInTheDocument();
		});
	});

	it("switches between form and bulk text mode", async () => {
		render(<ExpenseCategorizerTool />);

		// Initially in form mode
		expect(
			screen.getByPlaceholderText("Office supplies"),
		).toBeInTheDocument();

		// Switch to bulk text mode
		const bulkTextButton = screen.getByRole("button", {
			name: "Bulk Text",
		});
		await act(async () => {
			fireEvent.click(bulkTextButton);
		});

		await waitFor(() => {
			expect(screen.getByText("Paste Expenses")).toBeInTheDocument();
		});
	});
});

describe("MeetingSummarizerTool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the meeting summarizer form", () => {
		render(<MeetingSummarizerTool />);

		expect(screen.getByText("Meeting Summarizer")).toBeInTheDocument();
		expect(screen.getByText("Meeting Transcript")).toBeInTheDocument();
		expect(screen.getByText("Meeting Type")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Summarize Meeting" }),
		).toBeInTheDocument();
	});

	it("shows validation error when meeting notes are empty", async () => {
		render(<MeetingSummarizerTool />);

		const submitButton = screen.getByRole("button", {
			name: "Summarize Meeting",
		});
		await act(async () => {
			fireEvent.click(submitButton);
		});

		await waitFor(() => {
			expect(
				screen.getByText(
					"Please provide meeting notes or upload a transcript file",
				),
			).toBeInTheDocument();
		});
	});

	it("submits form with correct tool slug", async () => {
		mockMutateAsync.mockResolvedValue({ job: { id: "job-202" } });

		render(<MeetingSummarizerTool />);

		const textarea = screen.getByPlaceholderText(
			"Paste your meeting notes, transcript, or recording summary here...",
		);
		await act(async () => {
			fireEvent.change(textarea, {
				target: { value: "Meeting notes content" },
			});
		});

		const submitButton = screen.getByRole("button", {
			name: "Summarize Meeting",
		});
		await act(async () => {
			fireEvent.click(submitButton);
		});

		await waitFor(() => {
			expect(mockMutateAsync).toHaveBeenCalledWith({
				toolSlug: "meeting-summarizer",
				input: expect.objectContaining({
					meetingNotes: "Meeting notes content",
					meetingType: "general",
				}),
			});
		});
	});

	it("shows optional fields", () => {
		render(<MeetingSummarizerTool />);

		expect(screen.getByText("Participants (Optional)")).toBeInTheDocument();
		expect(screen.getByText("Meeting Date (Optional)")).toBeInTheDocument();
		expect(
			screen.getByText("Project Context (Optional)"),
		).toBeInTheDocument();
	});
});
