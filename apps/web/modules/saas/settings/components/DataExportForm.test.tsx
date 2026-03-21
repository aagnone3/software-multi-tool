import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock orpc client
vi.mock("@shared/lib/orpc-client", () => ({
	orpcClient: {
		gdpr: {
			listExports: vi.fn(),
			requestExport: vi.fn(),
		},
	},
}));

// Mock toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

import { orpcClient } from "@shared/lib/orpc-client";
import { toast } from "sonner";
import { DataExportForm } from "./DataExportForm";

const mockOrpcClient = orpcClient as unknown as {
	gdpr: {
		listExports: ReturnType<typeof vi.fn>;
		requestExport: ReturnType<typeof vi.fn>;
	};
};
const mockToast = toast as unknown as {
	success: ReturnType<typeof vi.fn>;
	error: ReturnType<typeof vi.fn>;
};

function makeWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>
			{children}
		</QueryClientProvider>
	);
}

describe("DataExportForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the request export button", async () => {
		mockOrpcClient.gdpr.listExports.mockResolvedValue({ exports: [] });
		render(<DataExportForm />, { wrapper: makeWrapper() });
		expect(screen.getByText("Request data export")).toBeTruthy();
	});

	it("shows empty state with no export history", async () => {
		mockOrpcClient.gdpr.listExports.mockResolvedValue({ exports: [] });
		render(<DataExportForm />, { wrapper: makeWrapper() });
		await waitFor(() => {
			expect(screen.queryByText("Recent exports")).toBeNull();
		});
	});

	it("shows recent exports when available", async () => {
		const createdAt = new Date("2024-01-15T10:00:00Z").toISOString();
		mockOrpcClient.gdpr.listExports.mockResolvedValue({
			exports: [
				{
					jobId: "job-1",
					status: "COMPLETED",
					createdAt,
					downloadUrl: "https://example.com/export.json",
					expiresAt: new Date(Date.now() + 3600000).toISOString(),
					totalRecords: 42,
					error: null,
				},
			],
		});
		render(<DataExportForm />, { wrapper: makeWrapper() });
		await waitFor(() => {
			expect(screen.getByText("Recent exports")).toBeTruthy();
		});
	});

	it("shows download link for recent completed export with valid URL", async () => {
		mockOrpcClient.gdpr.listExports.mockResolvedValue({
			exports: [
				{
					jobId: "job-1",
					status: "COMPLETED",
					createdAt: new Date().toISOString(),
					downloadUrl: "https://example.com/export.json",
					expiresAt: new Date(Date.now() + 3600000).toISOString(),
					totalRecords: null,
					error: null,
				},
			],
		});
		render(<DataExportForm />, { wrapper: makeWrapper() });
		await waitFor(() => {
			expect(screen.getByText("Download latest export")).toBeTruthy();
		});
	});

	it("shows processing state for pending export", async () => {
		mockOrpcClient.gdpr.listExports.mockResolvedValue({
			exports: [
				{
					jobId: "job-1",
					status: "PENDING",
					createdAt: new Date().toISOString(),
					downloadUrl: null,
					expiresAt: null,
					totalRecords: null,
					error: null,
				},
			],
		});
		render(<DataExportForm />, { wrapper: makeWrapper() });
		await waitFor(() => {
			// The button should show "Export in progress" when there's an active export
			expect(screen.getByText("Export in progress")).toBeTruthy();
		});
	});

	it("shows expired label for expired completed export", async () => {
		mockOrpcClient.gdpr.listExports.mockResolvedValue({
			exports: [
				{
					jobId: "job-1",
					status: "COMPLETED",
					createdAt: new Date().toISOString(),
					downloadUrl: "https://example.com/old.json",
					expiresAt: new Date(Date.now() - 3600000).toISOString(),
					totalRecords: null,
					error: null,
				},
			],
		});
		render(<DataExportForm />, { wrapper: makeWrapper() });
		await waitFor(() => {
			expect(screen.getByText("Expired")).toBeTruthy();
		});
	});

	it("calls requestExport on button click and shows success toast", async () => {
		mockOrpcClient.gdpr.listExports.mockResolvedValue({ exports: [] });
		mockOrpcClient.gdpr.requestExport.mockResolvedValue({
			message: "Export requested successfully",
		});

		render(<DataExportForm />, { wrapper: makeWrapper() });

		await waitFor(() => {
			expect(screen.getByText("Request data export")).toBeTruthy();
		});

		await userEvent.click(screen.getByText("Request data export"));

		await waitFor(() => {
			expect(mockOrpcClient.gdpr.requestExport).toHaveBeenCalledWith({
				format: "json",
			});
			expect(mockToast.success).toHaveBeenCalledWith(
				"Export requested successfully",
			);
		});
	});

	it("shows rate-limit error toast on 24-hour limit error", async () => {
		mockOrpcClient.gdpr.listExports.mockResolvedValue({ exports: [] });
		mockOrpcClient.gdpr.requestExport.mockRejectedValue(
			new Error("You can only request an export once every 24 hours"),
		);

		render(<DataExportForm />, { wrapper: makeWrapper() });

		await waitFor(() => {
			expect(screen.getByText("Request data export")).toBeTruthy();
		});

		await userEvent.click(screen.getByText("Request data export"));

		await waitFor(() => {
			expect(mockToast.error).toHaveBeenCalledWith(
				"You can only request an export once every 24 hours",
			);
		});
	});
});
