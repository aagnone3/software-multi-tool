import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { PostgresTestHarness } from "./postgres-test-harness";
import { createPostgresTestHarness } from "./postgres-test-harness";

const HOOK_TIMEOUT = 120_000;
const TEST_TIMEOUT = 30_000;

describe.sequential("Tool model (integration)", () => {
	let harness: PostgresTestHarness | undefined;
	let testUserId: string;
	let testOrganizationId: string;

	beforeAll(async () => {
		harness = await createPostgresTestHarness();
	}, HOOK_TIMEOUT);

	beforeEach(async () => {
		if (!harness) {
			throw new Error("Postgres test harness did not initialize.");
		}
		await harness.resetDatabase();

		// Create test user and organization for FK tests
		const user = await harness.prisma.user.create({
			data: {
				id: "test-user-1",
				name: "Test User",
				email: "test@example.com",
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});
		testUserId = user.id;

		const org = await harness.prisma.organization.create({
			data: {
				id: "test-org-1",
				name: "Test Organization",
				slug: "test-org",
				createdAt: new Date(),
			},
		});
		testOrganizationId = org.id;
	}, TEST_TIMEOUT);

	afterAll(async () => {
		await harness?.cleanup();
	}, HOOK_TIMEOUT);

	describe("Tool CRUD", () => {
		it(
			"can create a tool with all fields",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const tool = await harness.prisma.tool.create({
					data: {
						slug: "test-tool",
						name: "Test Tool",
						description: "A test tool for testing",
						icon: "test-icon",
						creditCost: 5,
						creditUnit: "page",
						enabled: true,
						public: false,
					},
				});

				expect(tool).toBeDefined();
				expect(tool.slug).toBe("test-tool");
				expect(tool.name).toBe("Test Tool");
				expect(tool.description).toBe("A test tool for testing");
				expect(tool.icon).toBe("test-icon");
				expect(tool.creditCost).toBe(5);
				expect(tool.creditUnit).toBe("page");
				expect(tool.enabled).toBe(true);
				expect(tool.public).toBe(false);
			},
			TEST_TIMEOUT,
		);

		it(
			"enforces unique constraint on slug",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.tool.create({
					data: {
						slug: "unique-tool",
						name: "First Tool",
					},
				});

				await expect(
					harness.prisma.tool.create({
						data: {
							slug: "unique-tool",
							name: "Second Tool",
						},
					}),
				).rejects.toThrow();
			},
			TEST_TIMEOUT,
		);

		it(
			"applies default values correctly",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const tool = await harness.prisma.tool.create({
					data: {
						slug: "minimal-tool",
						name: "Minimal Tool",
					},
				});

				expect(tool.creditCost).toBe(1);
				expect(tool.creditUnit).toBe("request");
				expect(tool.enabled).toBe(true);
				expect(tool.public).toBe(false);
			},
			TEST_TIMEOUT,
		);
	});

	describe("Tool FK relationships", () => {
		it(
			"can link ToolJob to Tool via toolId",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const tool = await harness.prisma.tool.create({
					data: {
						slug: "job-tool",
						name: "Job Tool",
					},
				});

				const job = await harness.prisma.toolJob.create({
					data: {
						toolSlug: "job-tool",
						toolId: tool.id,
						input: { test: "data" },
						expiresAt: new Date(Date.now() + 86400000),
					},
				});

				expect(job.toolId).toBe(tool.id);
				expect(job.toolSlug).toBe("job-tool");

				// Verify relation works
				const jobWithTool = await harness.prisma.toolJob.findUnique({
					where: { id: job.id },
					include: { tool: true },
				});

				expect(jobWithTool?.tool).toBeDefined();
				expect(jobWithTool?.tool?.slug).toBe("job-tool");
			},
			TEST_TIMEOUT,
		);

		it(
			"can link CreditTransaction to Tool via toolId",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const tool = await harness.prisma.tool.create({
					data: {
						slug: "credit-tool",
						name: "Credit Tool",
						creditCost: 2,
					},
				});

				const balance = await harness.prisma.creditBalance.create({
					data: {
						organizationId: testOrganizationId,
						periodStart: new Date("2026-01-01"),
						periodEnd: new Date("2026-01-31"),
						included: 100,
					},
				});

				const transaction =
					await harness.prisma.creditTransaction.create({
						data: {
							balanceId: balance.id,
							amount: 2,
							type: "USAGE",
							toolSlug: "credit-tool",
							toolId: tool.id,
						},
					});

				expect(transaction.toolId).toBe(tool.id);

				// Verify relation works
				const txWithTool =
					await harness.prisma.creditTransaction.findUnique({
						where: { id: transaction.id },
						include: { tool: true },
					});

				expect(txWithTool?.tool).toBeDefined();
				expect(txWithTool?.tool?.creditCost).toBe(2);
			},
			TEST_TIMEOUT,
		);

		it(
			"can link RateLimitEntry to Tool via toolId",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const tool = await harness.prisma.tool.create({
					data: {
						slug: "rate-limit-tool",
						name: "Rate Limit Tool",
					},
				});

				const entry = await harness.prisma.rateLimitEntry.create({
					data: {
						identifier: "user:test-user",
						toolSlug: "rate-limit-tool",
						toolId: tool.id,
						windowStart: new Date(),
						windowEnd: new Date(Date.now() + 3600000),
						count: 5,
					},
				});

				expect(entry.toolId).toBe(tool.id);

				// Verify relation works
				const entryWithTool =
					await harness.prisma.rateLimitEntry.findUnique({
						where: { id: entry.id },
						include: { tool: true },
					});

				expect(entryWithTool?.tool).toBeDefined();
				expect(entryWithTool?.tool?.slug).toBe("rate-limit-tool");
			},
			TEST_TIMEOUT,
		);

		it(
			"can link AgentSession to Tool via toolId",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const tool = await harness.prisma.tool.create({
					data: {
						slug: "session-tool",
						name: "Session Tool",
					},
				});

				const session = await harness.prisma.agentSession.create({
					data: {
						sessionType: "test-session",
						userId: testUserId,
						toolSlug: "session-tool",
						toolId: tool.id,
					},
				});

				expect(session.toolId).toBe(tool.id);

				// Verify relation works
				const sessionWithTool =
					await harness.prisma.agentSession.findUnique({
						where: { id: session.id },
						include: { tool: true },
					});

				expect(sessionWithTool?.tool).toBeDefined();
				expect(sessionWithTool?.tool?.slug).toBe("session-tool");
			},
			TEST_TIMEOUT,
		);

		it(
			"SET NULL on delete preserves referencing records",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const tool = await harness.prisma.tool.create({
					data: {
						slug: "deletable-tool",
						name: "Deletable Tool",
					},
				});

				const job = await harness.prisma.toolJob.create({
					data: {
						toolSlug: "deletable-tool",
						toolId: tool.id,
						input: {},
						expiresAt: new Date(Date.now() + 86400000),
					},
				});

				// Delete the tool
				await harness.prisma.tool.delete({
					where: { id: tool.id },
				});

				// Job should still exist but with null toolId
				const updatedJob = await harness.prisma.toolJob.findUnique({
					where: { id: job.id },
				});

				expect(updatedJob).toBeDefined();
				expect(updatedJob?.toolSlug).toBe("deletable-tool");
				expect(updatedJob?.toolId).toBeNull();
			},
			TEST_TIMEOUT,
		);
	});

	describe("Tool queries", () => {
		it(
			"can query tools with related jobs",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const tool = await harness.prisma.tool.create({
					data: {
						slug: "query-tool",
						name: "Query Tool",
					},
				});

				await harness.prisma.toolJob.createMany({
					data: [
						{
							toolSlug: "query-tool",
							toolId: tool.id,
							input: { job: 1 },
							expiresAt: new Date(Date.now() + 86400000),
						},
						{
							toolSlug: "query-tool",
							toolId: tool.id,
							input: { job: 2 },
							expiresAt: new Date(Date.now() + 86400000),
						},
					],
				});

				const toolWithJobs = await harness.prisma.tool.findUnique({
					where: { slug: "query-tool" },
					include: { jobs: true },
				});

				expect(toolWithJobs?.jobs).toHaveLength(2);
			},
			TEST_TIMEOUT,
		);

		it(
			"can upsert tools (sync from config pattern)",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				// Initial create
				const created = await harness.prisma.tool.upsert({
					where: { slug: "upsert-tool" },
					create: {
						slug: "upsert-tool",
						name: "Initial Name",
						creditCost: 1,
					},
					update: {
						name: "Updated Name",
						creditCost: 5,
					},
				});

				expect(created.name).toBe("Initial Name");
				expect(created.creditCost).toBe(1);

				// Update existing
				const updated = await harness.prisma.tool.upsert({
					where: { slug: "upsert-tool" },
					create: {
						slug: "upsert-tool",
						name: "Initial Name",
						creditCost: 1,
					},
					update: {
						name: "Updated Name",
						creditCost: 5,
					},
				});

				expect(updated.id).toBe(created.id);
				expect(updated.name).toBe("Updated Name");
				expect(updated.creditCost).toBe(5);
			},
			TEST_TIMEOUT,
		);
	});
});
