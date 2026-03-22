import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetToolJobById = vi.hoisted(() => vi.fn());
const mockMarkJobCompleted = vi.hoisted(() => vi.fn());
const mockMarkJobFailed = vi.hoisted(() => vi.fn());
const mockProcessInvoiceJob = vi.hoisted(() => vi.fn());
const mockLoggerInfo = vi.hoisted(() => vi.fn());
const mockLoggerError = vi.hoisted(() => vi.fn());

vi.mock("@repo/database", () => ({
	getToolJobById: mockGetToolJobById,
	markJobCompleted: mockMarkJobCompleted,
	markJobFailed: mockMarkJobFailed,
}));

vi.mock("@repo/api/modules/invoice-processor", () => ({
	processInvoiceJob: mockProcessInvoiceJob,
}));

vi.mock("@repo/logs", () => ({
	logger: { info: mockLoggerInfo, error: mockLoggerError },
}));

vi.mock("../client", () => ({
	inngest: {
		createFunction: (
			_config: unknown,
			_trigger: unknown,
			handler: (args: { event: unknown; step: unknown }) => unknown,
		) => handler,
	},
}));

import { invoiceProcessor } from "./invoice-processor";

describe("invoiceProcessor inngest function", () => {
	const mockJob = { id: "job-1", toolSlug: "invoice-processor" };
	const toolJobId = "job-1";

	beforeEach(() => {
		vi.clearAllMocks();
		mockGetToolJobById.mockResolvedValue(mockJob);
		mockProcessInvoiceJob.mockResolvedValue({
			success: true,
			output: { result: "ok" },
		});
		mockMarkJobCompleted.mockResolvedValue(undefined);
		mockMarkJobFailed.mockResolvedValue(undefined);
	});

	it("runs all three steps", async () => {
		const step = {
			run: vi.fn(async (_: string, fn: () => unknown) => fn()),
		};
		await (
			invoiceProcessor as unknown as (
				...args: unknown[]
			) => Promise<Record<string, unknown>>
		)({
			event: { data: { toolJobId } },
			step,
		});
		expect(step.run).toHaveBeenCalledTimes(3);
	});

	it("returns success when job completes", async () => {
		const step = {
			run: vi.fn(async (_: string, fn: () => unknown) => fn()),
		};
		const result = await (
			invoiceProcessor as unknown as (
				...args: unknown[]
			) => Promise<Record<string, unknown>>
		)({
			event: { data: { toolJobId } },
			step,
		});
		expect(result.success).toBe(true);
		expect(result.toolJobId).toBe(toolJobId);
	});

	it("marks job failed when process returns success=false", async () => {
		mockProcessInvoiceJob.mockResolvedValue({
			success: false,
			error: "AI error",
		});
		const step = {
			run: vi.fn(async (_: string, fn: () => unknown) => fn()),
		};
		const result = await (
			invoiceProcessor as unknown as (
				...args: unknown[]
			) => Promise<Record<string, unknown>>
		)({
			event: { data: { toolJobId } },
			step,
		});
		expect(mockMarkJobFailed).toHaveBeenCalledWith(toolJobId, "AI error");
		expect(result.success).toBe(false);
	});

	it("throws if job not found during validate step", async () => {
		mockGetToolJobById.mockResolvedValueOnce(null);
		const step = {
			run: vi.fn(async (_: string, fn: () => unknown) => fn()),
		};
		await expect(
			(
				invoiceProcessor as unknown as (
					...args: unknown[]
				) => Promise<Record<string, unknown>>
			)({
				event: { data: { toolJobId } },
				step,
			}),
		).rejects.toThrow("Tool job not found: job-1");
	});

	it("marks job completed with output", async () => {
		const output = { result: "detailed" };
		mockProcessInvoiceJob.mockResolvedValue({ success: true, output });
		const step = {
			run: vi.fn(async (_: string, fn: () => unknown) => fn()),
		};
		await (
			invoiceProcessor as unknown as (
				...args: unknown[]
			) => Promise<Record<string, unknown>>
		)({
			event: { data: { toolJobId } },
			step,
		});
		expect(mockMarkJobCompleted).toHaveBeenCalledWith(toolJobId, output);
	});

	it("uses 'Unknown error' when error message is missing", async () => {
		mockProcessInvoiceJob.mockResolvedValue({ success: false });
		const step = {
			run: vi.fn(async (_: string, fn: () => unknown) => fn()),
		};
		await (
			invoiceProcessor as unknown as (
				...args: unknown[]
			) => Promise<Record<string, unknown>>
		)({
			event: { data: { toolJobId } },
			step,
		});
		expect(mockMarkJobFailed).toHaveBeenCalledWith(
			toolJobId,
			"Unknown error",
		);
	});
});
