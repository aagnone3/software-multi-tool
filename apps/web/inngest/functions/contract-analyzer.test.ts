import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetToolJobById = vi.hoisted(() => vi.fn());
const mockMarkJobCompleted = vi.hoisted(() => vi.fn());
const mockMarkJobFailed = vi.hoisted(() => vi.fn());
const mockProcessContractJob = vi.hoisted(() => vi.fn());
const mockLoggerInfo = vi.hoisted(() => vi.fn());
const mockLoggerError = vi.hoisted(() => vi.fn());

vi.mock("@repo/database", () => ({
	getToolJobById: mockGetToolJobById,
	markJobCompleted: mockMarkJobCompleted,
	markJobFailed: mockMarkJobFailed,
}));

vi.mock("@repo/api/modules/contract-analyzer", () => ({
	processContractJob: mockProcessContractJob,
}));

vi.mock("@repo/logs", () => ({
	logger: {
		info: mockLoggerInfo,
		error: mockLoggerError,
	},
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

// Import after mocks
import { contractAnalyzer } from "./contract-analyzer";

describe("contractAnalyzer inngest function", () => {
	const mockJob = { id: "job-1", toolSlug: "contract-analyzer" };
	const toolJobId = "job-1";

	const makeStep = (overrides?: {
		validateJob?: () => unknown;
		processContract?: () => unknown;
		updateJobStatus?: () => unknown;
	}) => {
		return {
			run: vi.fn(async (_name: string, fn: () => unknown) => {
				if (overrides) {
					const result = await fn();
					return result;
				}
				return fn();
			}),
		};
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockGetToolJobById.mockResolvedValue(mockJob);
		mockProcessContractJob.mockResolvedValue({
			success: true,
			output: { analysis: "done" },
		});
		mockMarkJobCompleted.mockResolvedValue(undefined);
		mockMarkJobFailed.mockResolvedValue(undefined);
	});

	it("runs all three steps in order", async () => {
		const step = makeStep();
		const result = await (
			contractAnalyzer as unknown as (
				...args: unknown[]
			) => Promise<Record<string, unknown>>
		)({
			event: { data: { toolJobId } },
			step,
		});

		expect(step.run).toHaveBeenCalledTimes(3);
		expect(step.run).toHaveBeenNthCalledWith(
			1,
			"validate-job",
			expect.any(Function),
		);
		expect(step.run).toHaveBeenNthCalledWith(
			2,
			"process-contract",
			expect.any(Function),
		);
		expect(step.run).toHaveBeenNthCalledWith(
			3,
			"update-job-status",
			expect.any(Function),
		);
	});

	it("returns success when job completes", async () => {
		mockGetToolJobById.mockResolvedValue(mockJob);
		mockProcessContractJob.mockResolvedValue({
			success: true,
			output: { analysis: "done" },
		});

		const step = {
			run: vi.fn(async (_name: string, fn: () => unknown) => fn()),
		};

		const result = await (
			contractAnalyzer as unknown as (
				...args: unknown[]
			) => Promise<Record<string, unknown>>
		)({
			event: { data: { toolJobId } },
			step,
		});

		expect(result.success).toBe(true);
		expect(result.toolJobId).toBe(toolJobId);
	});

	it("marks job failed when processContractJob returns success=false", async () => {
		mockGetToolJobById.mockResolvedValue(mockJob);
		mockProcessContractJob.mockResolvedValue({
			success: false,
			error: "AI error",
		});

		const step = {
			run: vi.fn(async (_name: string, fn: () => unknown) => fn()),
		};

		const result = await (
			contractAnalyzer as unknown as (
				...args: unknown[]
			) => Promise<Record<string, unknown>>
		)({
			event: { data: { toolJobId } },
			step,
		});

		expect(mockMarkJobFailed).toHaveBeenCalledWith(toolJobId, "AI error");
		expect(result.success).toBe(false);
		expect(result.error).toBe("AI error");
	});

	it("throws if job not found during validate step", async () => {
		mockGetToolJobById.mockResolvedValueOnce(null);

		const step = {
			run: vi.fn(async (_name: string, fn: () => unknown) => fn()),
		};

		await expect(
			(
				contractAnalyzer as unknown as (
					...args: unknown[]
				) => Promise<Record<string, unknown>>
			)({
				event: { data: { toolJobId } },
				step,
			}),
		).rejects.toThrow("Tool job not found: job-1");
	});

	it("marks job completed with output", async () => {
		const output = { analysis: "detailed result" };
		mockGetToolJobById.mockResolvedValue(mockJob);
		mockProcessContractJob.mockResolvedValue({ success: true, output });

		const step = {
			run: vi.fn(async (_name: string, fn: () => unknown) => fn()),
		};

		await (
			contractAnalyzer as unknown as (
				...args: unknown[]
			) => Promise<Record<string, unknown>>
		)({
			event: { data: { toolJobId } },
			step,
		});

		expect(mockMarkJobCompleted).toHaveBeenCalledWith(toolJobId, output);
	});

	it("handles missing error message in failed result", async () => {
		mockGetToolJobById.mockResolvedValue(mockJob);
		mockProcessContractJob.mockResolvedValue({ success: false });

		const step = {
			run: vi.fn(async (_name: string, fn: () => unknown) => fn()),
		};

		await (
			contractAnalyzer as unknown as (
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
