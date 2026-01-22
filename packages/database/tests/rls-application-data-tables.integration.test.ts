/**
 * Integration tests for Row Level Security (RLS) on application data tables.
 *
 * These tests verify that:
 * 1. RLS is properly enabled on all 8 application data tables
 * 2. Prisma (using service role) can still perform CRUD operations
 *
 * Tables tested:
 * - ai_chat: Chat conversations
 * - purchase: Subscriptions/purchases
 * - credit_balance: Org credit balances
 * - credit_transaction: Credit history
 * - audit_log: Activity logs
 * - notification: User notifications
 * - tool_job: Background jobs
 * - rate_limit_entry: Rate limit tracking
 *
 * Since Prisma connects directly to PostgreSQL (bypassing PostgREST),
 * it uses the service role which bypasses RLS. These tests confirm that
 * enabling RLS doesn't break the application functionality.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { PostgresTestHarness } from "./postgres-test-harness";
import { createPostgresTestHarness } from "./postgres-test-harness";

const HOOK_TIMEOUT = 120_000;
const TEST_TIMEOUT = 30_000;

describe.sequential("RLS on application data tables (integration)", () => {
	let harness: PostgresTestHarness | undefined;
	let testUserId: string;
	let testOrganizationId: string;
	let testCreditBalanceId: string;

	beforeAll(async () => {
		harness = await createPostgresTestHarness();
	}, HOOK_TIMEOUT);

	beforeEach(async () => {
		if (!harness) {
			throw new Error("Postgres test harness did not initialize.");
		}
		await harness.resetDatabase();

		// Create a test user (required for FK constraints)
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

		// Create a test organization (required for FK constraints)
		const organization = await harness.prisma.organization.create({
			data: {
				id: "test-org-1",
				name: "Test Organization",
				slug: "test-org",
				createdAt: new Date(),
			},
		});
		testOrganizationId = organization.id;

		// Create a test credit balance (required for FK constraints on credit_transaction)
		const creditBalance = await harness.prisma.creditBalance.create({
			data: {
				id: "test-balance-1",
				organizationId: testOrganizationId,
				periodStart: new Date(),
				periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
				included: 1000,
				used: 0,
				overage: 0,
				purchasedCredits: 0,
			},
		});
		testCreditBalanceId = creditBalance.id;
	}, TEST_TIMEOUT);

	afterAll(async () => {
		await harness?.cleanup();
	}, HOOK_TIMEOUT);

	describe("RLS configuration verification", () => {
		it(
			"has RLS enabled on ai_chat table",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const result = await harness.prisma.$queryRaw<
					{ relrowsecurity: boolean }[]
				>`
					SELECT relrowsecurity
					FROM pg_class
					WHERE relname = 'ai_chat' AND relnamespace = (
						SELECT oid FROM pg_namespace WHERE nspname = 'public'
					)
				`;

				expect(result).toHaveLength(1);
				expect(result[0].relrowsecurity).toBe(true);
			},
			TEST_TIMEOUT,
		);

		it(
			"has RLS enabled on purchase table",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const result = await harness.prisma.$queryRaw<
					{ relrowsecurity: boolean }[]
				>`
					SELECT relrowsecurity
					FROM pg_class
					WHERE relname = 'purchase' AND relnamespace = (
						SELECT oid FROM pg_namespace WHERE nspname = 'public'
					)
				`;

				expect(result).toHaveLength(1);
				expect(result[0].relrowsecurity).toBe(true);
			},
			TEST_TIMEOUT,
		);

		it(
			"has RLS enabled on credit_balance table",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const result = await harness.prisma.$queryRaw<
					{ relrowsecurity: boolean }[]
				>`
					SELECT relrowsecurity
					FROM pg_class
					WHERE relname = 'credit_balance' AND relnamespace = (
						SELECT oid FROM pg_namespace WHERE nspname = 'public'
					)
				`;

				expect(result).toHaveLength(1);
				expect(result[0].relrowsecurity).toBe(true);
			},
			TEST_TIMEOUT,
		);

		it(
			"has RLS enabled on credit_transaction table",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const result = await harness.prisma.$queryRaw<
					{ relrowsecurity: boolean }[]
				>`
					SELECT relrowsecurity
					FROM pg_class
					WHERE relname = 'credit_transaction' AND relnamespace = (
						SELECT oid FROM pg_namespace WHERE nspname = 'public'
					)
				`;

				expect(result).toHaveLength(1);
				expect(result[0].relrowsecurity).toBe(true);
			},
			TEST_TIMEOUT,
		);

		it(
			"has RLS enabled on audit_log table",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const result = await harness.prisma.$queryRaw<
					{ relrowsecurity: boolean }[]
				>`
					SELECT relrowsecurity
					FROM pg_class
					WHERE relname = 'audit_log' AND relnamespace = (
						SELECT oid FROM pg_namespace WHERE nspname = 'public'
					)
				`;

				expect(result).toHaveLength(1);
				expect(result[0].relrowsecurity).toBe(true);
			},
			TEST_TIMEOUT,
		);

		it(
			"has RLS enabled on notification table",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const result = await harness.prisma.$queryRaw<
					{ relrowsecurity: boolean }[]
				>`
					SELECT relrowsecurity
					FROM pg_class
					WHERE relname = 'notification' AND relnamespace = (
						SELECT oid FROM pg_namespace WHERE nspname = 'public'
					)
				`;

				expect(result).toHaveLength(1);
				expect(result[0].relrowsecurity).toBe(true);
			},
			TEST_TIMEOUT,
		);

		it(
			"has RLS enabled on tool_job table",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const result = await harness.prisma.$queryRaw<
					{ relrowsecurity: boolean }[]
				>`
					SELECT relrowsecurity
					FROM pg_class
					WHERE relname = 'tool_job' AND relnamespace = (
						SELECT oid FROM pg_namespace WHERE nspname = 'public'
					)
				`;

				expect(result).toHaveLength(1);
				expect(result[0].relrowsecurity).toBe(true);
			},
			TEST_TIMEOUT,
		);

		it(
			"has RLS enabled on rate_limit_entry table",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const result = await harness.prisma.$queryRaw<
					{ relrowsecurity: boolean }[]
				>`
					SELECT relrowsecurity
					FROM pg_class
					WHERE relname = 'rate_limit_entry' AND relnamespace = (
						SELECT oid FROM pg_namespace WHERE nspname = 'public'
					)
				`;

				expect(result).toHaveLength(1);
				expect(result[0].relrowsecurity).toBe(true);
			},
			TEST_TIMEOUT,
		);
	});

	describe("AiChat table CRUD (service role bypasses RLS)", () => {
		it(
			"can create an ai_chat",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const chat = await harness.prisma.aiChat.create({
					data: {
						id: "chat-1",
						userId: testUserId,
						title: "Test Chat",
						messages: JSON.stringify([
							{ role: "user", content: "Hello" },
						]),
					},
				});

				expect(chat).toBeDefined();
				expect(chat.title).toBe("Test Chat");
				expect(chat.userId).toBe(testUserId);
			},
			TEST_TIMEOUT,
		);

		it(
			"can read ai_chats",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.aiChat.create({
					data: {
						id: "chat-1",
						userId: testUserId,
						title: "Chat 1",
						messages: "[]",
					},
				});

				const chats = await harness.prisma.aiChat.findMany({
					where: { userId: testUserId },
				});

				expect(chats).toHaveLength(1);
				expect(chats[0].title).toBe("Chat 1");
			},
			TEST_TIMEOUT,
		);

		it(
			"can update an ai_chat",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.aiChat.create({
					data: {
						id: "chat-1",
						userId: testUserId,
						title: "Original Title",
						messages: "[]",
					},
				});

				const updated = await harness.prisma.aiChat.update({
					where: { id: "chat-1" },
					data: { title: "Updated Title" },
				});

				expect(updated.title).toBe("Updated Title");
			},
			TEST_TIMEOUT,
		);

		it(
			"can delete an ai_chat",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.aiChat.create({
					data: {
						id: "chat-1",
						userId: testUserId,
						title: "To Delete",
						messages: "[]",
					},
				});

				await harness.prisma.aiChat.delete({
					where: { id: "chat-1" },
				});

				const deleted = await harness.prisma.aiChat.findUnique({
					where: { id: "chat-1" },
				});

				expect(deleted).toBeNull();
			},
			TEST_TIMEOUT,
		);
	});

	describe("Purchase table CRUD (service role bypasses RLS)", () => {
		it(
			"can create a purchase",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const purchase = await harness.prisma.purchase.create({
					data: {
						id: "purchase-1",
						userId: testUserId,
						type: "SUBSCRIPTION",
						customerId: "cus_test_123",
						subscriptionId: "sub_test_123",
						productId: "prod_test_123",
						status: "active",
					},
				});

				expect(purchase).toBeDefined();
				expect(purchase.customerId).toBe("cus_test_123");
				expect(purchase.status).toBe("active");
			},
			TEST_TIMEOUT,
		);

		it(
			"can read purchases",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.purchase.create({
					data: {
						id: "purchase-1",
						userId: testUserId,
						type: "SUBSCRIPTION",
						customerId: "cus_test_123",
						productId: "prod_test_123",
					},
				});

				const purchases = await harness.prisma.purchase.findMany({
					where: { userId: testUserId },
				});

				expect(purchases).toHaveLength(1);
			},
			TEST_TIMEOUT,
		);

		it(
			"can update a purchase",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.purchase.create({
					data: {
						id: "purchase-1",
						userId: testUserId,
						type: "SUBSCRIPTION",
						customerId: "cus_test_123",
						productId: "prod_test_123",
						status: "active",
					},
				});

				const updated = await harness.prisma.purchase.update({
					where: { id: "purchase-1" },
					data: { status: "canceled" },
				});

				expect(updated.status).toBe("canceled");
			},
			TEST_TIMEOUT,
		);

		it(
			"can delete a purchase",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.purchase.create({
					data: {
						id: "purchase-1",
						userId: testUserId,
						type: "SUBSCRIPTION",
						customerId: "cus_test_123",
						productId: "prod_test_123",
					},
				});

				await harness.prisma.purchase.delete({
					where: { id: "purchase-1" },
				});

				const deleted = await harness.prisma.purchase.findUnique({
					where: { id: "purchase-1" },
				});

				expect(deleted).toBeNull();
			},
			TEST_TIMEOUT,
		);
	});

	describe("CreditBalance table CRUD (service role bypasses RLS)", () => {
		it(
			"can create a credit_balance",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				// Create a separate org for this test
				const org = await harness.prisma.organization.create({
					data: {
						id: "balance-test-org",
						name: "Balance Test Org",
						slug: "balance-test",
						createdAt: new Date(),
					},
				});

				const balance = await harness.prisma.creditBalance.create({
					data: {
						id: "balance-2",
						organizationId: org.id,
						periodStart: new Date(),
						periodEnd: new Date(
							Date.now() + 30 * 24 * 60 * 60 * 1000,
						),
						included: 500,
						used: 100,
						overage: 0,
						purchasedCredits: 50,
					},
				});

				expect(balance).toBeDefined();
				expect(balance.included).toBe(500);
				expect(balance.used).toBe(100);
				expect(balance.purchasedCredits).toBe(50);
			},
			TEST_TIMEOUT,
		);

		it(
			"can read credit_balances",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const balances = await harness.prisma.creditBalance.findMany({
					where: { organizationId: testOrganizationId },
				});

				expect(balances).toHaveLength(1);
				expect(balances[0].included).toBe(1000);
			},
			TEST_TIMEOUT,
		);

		it(
			"can update a credit_balance",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const updated = await harness.prisma.creditBalance.update({
					where: { id: testCreditBalanceId },
					data: { used: 250, overage: 10 },
				});

				expect(updated.used).toBe(250);
				expect(updated.overage).toBe(10);
			},
			TEST_TIMEOUT,
		);

		it(
			"can delete a credit_balance",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				// Create a separate org and balance for deletion test
				const org = await harness.prisma.organization.create({
					data: {
						id: "delete-balance-org",
						name: "Delete Balance Org",
						slug: "delete-balance",
						createdAt: new Date(),
					},
				});

				await harness.prisma.creditBalance.create({
					data: {
						id: "balance-to-delete",
						organizationId: org.id,
						periodStart: new Date(),
						periodEnd: new Date(
							Date.now() + 30 * 24 * 60 * 60 * 1000,
						),
						included: 100,
					},
				});

				await harness.prisma.creditBalance.delete({
					where: { id: "balance-to-delete" },
				});

				const deleted = await harness.prisma.creditBalance.findUnique({
					where: { id: "balance-to-delete" },
				});

				expect(deleted).toBeNull();
			},
			TEST_TIMEOUT,
		);
	});

	describe("CreditTransaction table CRUD (service role bypasses RLS)", () => {
		it(
			"can create a credit_transaction",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const transaction =
					await harness.prisma.creditTransaction.create({
						data: {
							id: "transaction-1",
							balanceId: testCreditBalanceId,
							amount: -10,
							type: "USAGE",
							toolSlug: "news-analyzer",
							description: "Analyzed 1 article",
						},
					});

				expect(transaction).toBeDefined();
				expect(transaction.amount).toBe(-10);
				expect(transaction.type).toBe("USAGE");
				expect(transaction.toolSlug).toBe("news-analyzer");
			},
			TEST_TIMEOUT,
		);

		it(
			"can read credit_transactions",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.creditTransaction.create({
					data: {
						id: "transaction-1",
						balanceId: testCreditBalanceId,
						amount: -5,
						type: "USAGE",
					},
				});

				const transactions =
					await harness.prisma.creditTransaction.findMany({
						where: { balanceId: testCreditBalanceId },
					});

				expect(transactions).toHaveLength(1);
				expect(transactions[0].amount).toBe(-5);
			},
			TEST_TIMEOUT,
		);

		it(
			"can delete a credit_transaction",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.creditTransaction.create({
					data: {
						id: "transaction-to-delete",
						balanceId: testCreditBalanceId,
						amount: -1,
						type: "USAGE",
					},
				});

				await harness.prisma.creditTransaction.delete({
					where: { id: "transaction-to-delete" },
				});

				const deleted =
					await harness.prisma.creditTransaction.findUnique({
						where: { id: "transaction-to-delete" },
					});

				expect(deleted).toBeNull();
			},
			TEST_TIMEOUT,
		);
	});

	describe("AuditLog table CRUD (service role bypasses RLS)", () => {
		it(
			"can create an audit_log",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const log = await harness.prisma.auditLog.create({
					data: {
						id: "audit-1",
						userId: testUserId,
						organizationId: testOrganizationId,
						action: "USER_LOGIN",
						resource: "session",
						resourceId: "session-123",
						ipAddress: "192.168.1.1",
						userAgent: "Mozilla/5.0",
						success: true,
					},
				});

				expect(log).toBeDefined();
				expect(log.action).toBe("USER_LOGIN");
				expect(log.resource).toBe("session");
				expect(log.success).toBe(true);
			},
			TEST_TIMEOUT,
		);

		it(
			"can read audit_logs",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.auditLog.create({
					data: {
						id: "audit-1",
						userId: testUserId,
						action: "USER_LOGOUT",
						resource: "session",
						success: true,
					},
				});

				const logs = await harness.prisma.auditLog.findMany({
					where: { userId: testUserId },
				});

				expect(logs).toHaveLength(1);
				expect(logs[0].action).toBe("USER_LOGOUT");
			},
			TEST_TIMEOUT,
		);

		it(
			"can delete an audit_log",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.auditLog.create({
					data: {
						id: "audit-to-delete",
						action: "SYSTEM_EVENT",
						resource: "system",
						success: true,
					},
				});

				await harness.prisma.auditLog.delete({
					where: { id: "audit-to-delete" },
				});

				const deleted = await harness.prisma.auditLog.findUnique({
					where: { id: "audit-to-delete" },
				});

				expect(deleted).toBeNull();
			},
			TEST_TIMEOUT,
		);
	});

	describe("Notification table CRUD (service role bypasses RLS)", () => {
		it(
			"can create a notification",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const notification = await harness.prisma.notification.create({
					data: {
						id: "notification-1",
						userId: testUserId,
						type: "info",
						category: "system",
						title: "Welcome!",
						body: "Welcome to the platform.",
						read: false,
					},
				});

				expect(notification).toBeDefined();
				expect(notification.title).toBe("Welcome!");
				expect(notification.read).toBe(false);
			},
			TEST_TIMEOUT,
		);

		it(
			"can read notifications",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.notification.create({
					data: {
						id: "notification-1",
						userId: testUserId,
						type: "success",
						category: "billing",
						title: "Payment Received",
						body: "Your payment was successful.",
					},
				});

				const notifications =
					await harness.prisma.notification.findMany({
						where: { userId: testUserId },
					});

				expect(notifications).toHaveLength(1);
				expect(notifications[0].title).toBe("Payment Received");
			},
			TEST_TIMEOUT,
		);

		it(
			"can update a notification (mark as read)",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.notification.create({
					data: {
						id: "notification-1",
						userId: testUserId,
						type: "info",
						category: "team",
						title: "New Member",
						body: "A new member joined.",
						read: false,
					},
				});

				const updated = await harness.prisma.notification.update({
					where: { id: "notification-1" },
					data: { read: true, readAt: new Date() },
				});

				expect(updated.read).toBe(true);
				expect(updated.readAt).toBeDefined();
			},
			TEST_TIMEOUT,
		);

		it(
			"can delete a notification",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.notification.create({
					data: {
						id: "notification-to-delete",
						userId: testUserId,
						type: "warning",
						category: "security",
						title: "Security Alert",
						body: "Please review your account.",
					},
				});

				await harness.prisma.notification.delete({
					where: { id: "notification-to-delete" },
				});

				const deleted = await harness.prisma.notification.findUnique({
					where: { id: "notification-to-delete" },
				});

				expect(deleted).toBeNull();
			},
			TEST_TIMEOUT,
		);
	});

	describe("ToolJob table CRUD (service role bypasses RLS)", () => {
		it(
			"can create a tool_job",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const job = await harness.prisma.toolJob.create({
					data: {
						id: "job-1",
						toolSlug: "news-analyzer",
						status: "PENDING",
						priority: 1,
						input: JSON.stringify({ url: "https://example.com" }),
						userId: testUserId,
						expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
					},
				});

				expect(job).toBeDefined();
				expect(job.toolSlug).toBe("news-analyzer");
				expect(job.status).toBe("PENDING");
			},
			TEST_TIMEOUT,
		);

		it(
			"can read tool_jobs",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.toolJob.create({
					data: {
						id: "job-1",
						toolSlug: "pdf-generator",
						status: "PENDING",
						input: "{}",
						userId: testUserId,
						expiresAt: new Date(Date.now() + 86400000),
					},
				});

				const jobs = await harness.prisma.toolJob.findMany({
					where: { userId: testUserId },
				});

				expect(jobs).toHaveLength(1);
				expect(jobs[0].toolSlug).toBe("pdf-generator");
			},
			TEST_TIMEOUT,
		);

		it(
			"can update a tool_job",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.toolJob.create({
					data: {
						id: "job-1",
						toolSlug: "test-tool",
						status: "PENDING",
						input: "{}",
						userId: testUserId,
						expiresAt: new Date(Date.now() + 86400000),
					},
				});

				const updated = await harness.prisma.toolJob.update({
					where: { id: "job-1" },
					data: {
						status: "COMPLETED",
						output: JSON.stringify({ result: "success" }),
						completedAt: new Date(),
					},
				});

				expect(updated.status).toBe("COMPLETED");
				expect(updated.completedAt).toBeDefined();
			},
			TEST_TIMEOUT,
		);

		it(
			"can delete a tool_job",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				await harness.prisma.toolJob.create({
					data: {
						id: "job-to-delete",
						toolSlug: "cleanup-tool",
						status: "FAILED",
						input: "{}",
						error: "Something went wrong",
						expiresAt: new Date(Date.now() + 86400000),
					},
				});

				await harness.prisma.toolJob.delete({
					where: { id: "job-to-delete" },
				});

				const deleted = await harness.prisma.toolJob.findUnique({
					where: { id: "job-to-delete" },
				});

				expect(deleted).toBeNull();
			},
			TEST_TIMEOUT,
		);
	});

	describe("RateLimitEntry table CRUD (service role bypasses RLS)", () => {
		it(
			"can create a rate_limit_entry",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const windowStart = new Date();
				const entry = await harness.prisma.rateLimitEntry.create({
					data: {
						id: "rate-1",
						identifier: testUserId,
						toolSlug: "news-analyzer",
						windowStart,
						windowEnd: new Date(
							windowStart.getTime() + 60 * 60 * 1000,
						),
						count: 1,
					},
				});

				expect(entry).toBeDefined();
				expect(entry.identifier).toBe(testUserId);
				expect(entry.count).toBe(1);
			},
			TEST_TIMEOUT,
		);

		it(
			"can read rate_limit_entries",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const windowStart = new Date();
				await harness.prisma.rateLimitEntry.create({
					data: {
						id: "rate-1",
						identifier: testUserId,
						toolSlug: "pdf-tool",
						windowStart,
						windowEnd: new Date(windowStart.getTime() + 3600000),
						count: 5,
					},
				});

				const entries = await harness.prisma.rateLimitEntry.findMany({
					where: { identifier: testUserId },
				});

				expect(entries).toHaveLength(1);
				expect(entries[0].count).toBe(5);
			},
			TEST_TIMEOUT,
		);

		it(
			"can update a rate_limit_entry",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const windowStart = new Date();
				await harness.prisma.rateLimitEntry.create({
					data: {
						id: "rate-1",
						identifier: testUserId,
						toolSlug: "test-tool",
						windowStart,
						windowEnd: new Date(windowStart.getTime() + 3600000),
						count: 1,
					},
				});

				const updated = await harness.prisma.rateLimitEntry.update({
					where: { id: "rate-1" },
					data: { count: 10 },
				});

				expect(updated.count).toBe(10);
			},
			TEST_TIMEOUT,
		);

		it(
			"can delete a rate_limit_entry",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const windowStart = new Date();
				await harness.prisma.rateLimitEntry.create({
					data: {
						id: "rate-to-delete",
						identifier: "cleanup-test",
						toolSlug: "cleanup-tool",
						windowStart,
						windowEnd: new Date(windowStart.getTime() + 3600000),
						count: 0,
					},
				});

				await harness.prisma.rateLimitEntry.delete({
					where: { id: "rate-to-delete" },
				});

				const deleted = await harness.prisma.rateLimitEntry.findUnique({
					where: { id: "rate-to-delete" },
				});

				expect(deleted).toBeNull();
			},
			TEST_TIMEOUT,
		);
	});

	describe("Cascade delete behavior (RLS doesn't affect FK constraints)", () => {
		it(
			"cascades ai_chat deletion when user is deleted",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const user = await harness.prisma.user.create({
					data: {
						id: "cascade-chat-user",
						name: "Cascade Chat User",
						email: "cascade-chat@example.com",
						emailVerified: true,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				await harness.prisma.aiChat.create({
					data: {
						id: "cascade-chat",
						userId: user.id,
						title: "Chat to cascade",
						messages: "[]",
					},
				});

				await harness.prisma.user.delete({
					where: { id: user.id },
				});

				const chat = await harness.prisma.aiChat.findUnique({
					where: { id: "cascade-chat" },
				});

				expect(chat).toBeNull();
			},
			TEST_TIMEOUT,
		);

		it(
			"cascades purchase deletion when user is deleted",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const user = await harness.prisma.user.create({
					data: {
						id: "cascade-purchase-user",
						name: "Cascade Purchase User",
						email: "cascade-purchase@example.com",
						emailVerified: true,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				await harness.prisma.purchase.create({
					data: {
						id: "cascade-purchase",
						userId: user.id,
						type: "SUBSCRIPTION",
						customerId: "cus_cascade",
						productId: "prod_cascade",
					},
				});

				await harness.prisma.user.delete({
					where: { id: user.id },
				});

				const purchase = await harness.prisma.purchase.findUnique({
					where: { id: "cascade-purchase" },
				});

				expect(purchase).toBeNull();
			},
			TEST_TIMEOUT,
		);

		it(
			"cascades credit_balance deletion when organization is deleted",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const org = await harness.prisma.organization.create({
					data: {
						id: "cascade-credit-org",
						name: "Cascade Credit Org",
						slug: "cascade-credit",
						createdAt: new Date(),
					},
				});

				await harness.prisma.creditBalance.create({
					data: {
						id: "cascade-balance",
						organizationId: org.id,
						periodStart: new Date(),
						periodEnd: new Date(Date.now() + 86400000),
						included: 100,
					},
				});

				await harness.prisma.organization.delete({
					where: { id: org.id },
				});

				const balance = await harness.prisma.creditBalance.findUnique({
					where: { id: "cascade-balance" },
				});

				expect(balance).toBeNull();
			},
			TEST_TIMEOUT,
		);

		it(
			"cascades credit_transaction deletion when credit_balance is deleted",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const org = await harness.prisma.organization.create({
					data: {
						id: "cascade-tx-org",
						name: "Cascade TX Org",
						slug: "cascade-tx",
						createdAt: new Date(),
					},
				});

				const balance = await harness.prisma.creditBalance.create({
					data: {
						id: "cascade-tx-balance",
						organizationId: org.id,
						periodStart: new Date(),
						periodEnd: new Date(Date.now() + 86400000),
						included: 100,
					},
				});

				await harness.prisma.creditTransaction.create({
					data: {
						id: "cascade-transaction",
						balanceId: balance.id,
						amount: -5,
						type: "USAGE",
					},
				});

				await harness.prisma.creditBalance.delete({
					where: { id: balance.id },
				});

				const transaction =
					await harness.prisma.creditTransaction.findUnique({
						where: { id: "cascade-transaction" },
					});

				expect(transaction).toBeNull();
			},
			TEST_TIMEOUT,
		);

		it(
			"cascades notification deletion when user is deleted",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const user = await harness.prisma.user.create({
					data: {
						id: "cascade-notif-user",
						name: "Cascade Notif User",
						email: "cascade-notif@example.com",
						emailVerified: true,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				await harness.prisma.notification.create({
					data: {
						id: "cascade-notification",
						userId: user.id,
						type: "info",
						category: "system",
						title: "Test",
						body: "Test notification",
					},
				});

				await harness.prisma.user.delete({
					where: { id: user.id },
				});

				const notification =
					await harness.prisma.notification.findUnique({
						where: { id: "cascade-notification" },
					});

				expect(notification).toBeNull();
			},
			TEST_TIMEOUT,
		);

		it(
			"cascades tool_job deletion when user is deleted",
			async () => {
				if (!harness) {
					throw new Error("Harness not initialized");
				}

				const user = await harness.prisma.user.create({
					data: {
						id: "cascade-job-user",
						name: "Cascade Job User",
						email: "cascade-job@example.com",
						emailVerified: true,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				await harness.prisma.toolJob.create({
					data: {
						id: "cascade-job",
						toolSlug: "test-tool",
						status: "PENDING",
						input: "{}",
						userId: user.id,
						expiresAt: new Date(Date.now() + 86400000),
					},
				});

				await harness.prisma.user.delete({
					where: { id: user.id },
				});

				const job = await harness.prisma.toolJob.findUnique({
					where: { id: "cascade-job" },
				});

				expect(job).toBeNull();
			},
			TEST_TIMEOUT,
		);
	});
});
