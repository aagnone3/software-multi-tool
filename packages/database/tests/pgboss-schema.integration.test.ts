import { afterAll, beforeAll, describe, expect, it } from "vitest";
import PgBoss from "pg-boss";

import type { PostgresTestHarness } from "./postgres-test-harness";
import { createPostgresTestHarness } from "./postgres-test-harness";

const HOOK_TIMEOUT = 120_000;
const TEST_TIMEOUT = 30_000;

describe.sequential("pg-boss schema (integration)", () => {
	let harness: PostgresTestHarness | undefined;
	let boss: PgBoss | undefined;

	beforeAll(async () => {
		harness = await createPostgresTestHarness();
		await harness.resetDatabase();
	}, HOOK_TIMEOUT);

	afterAll(async () => {
		if (boss) {
			await boss.stop();
		}
		await harness?.cleanup();
	}, HOOK_TIMEOUT);

	it(
		"pg-boss starts with migrate: false after Prisma migration",
		async () => {
			if (!harness) {
				throw new Error("Postgres test harness did not initialize.");
			}

			boss = new PgBoss({
				connectionString: harness.connectionString,
				migrate: false,
				noSupervisor: true,
			});

			// This will throw if the schema is missing or incompatible
			await boss.start();
			expect(boss).toBeDefined();
		},
		TEST_TIMEOUT,
	);

	it(
		"pg-boss can create queues using dynamic partitioning",
		async () => {
			if (!boss) {
				throw new Error("pg-boss not initialized");
			}

			const queueName = "__integration_test_queue__";

			await boss.createQueue(queueName);

			// Verify queue was created
			const jobId = await boss.send(queueName, { test: true });
			expect(jobId).toBeTruthy();

			// Verify queue size
			const size = await boss.getQueueSize(queueName);
			expect(size).toBe(1);

			// Clean up
			await boss.purgeQueue(queueName);
			await boss.deleteQueue(queueName);
		},
		TEST_TIMEOUT,
	);

	it(
		"pgboss.version table has correct version",
		async () => {
			if (!harness) {
				throw new Error("Postgres test harness did not initialize.");
			}

			const result = await harness.prisma.$queryRaw<{ version: number }[]>`
				SELECT version FROM pgboss.version
			`;

			expect(result).toHaveLength(1);
			expect(result[0].version).toBe(24);
		},
		TEST_TIMEOUT,
	);

	it(
		"pgboss schema has all required tables",
		async () => {
			if (!harness) {
				throw new Error("Postgres test harness did not initialize.");
			}

			const tables = await harness.prisma.$queryRaw<{ tablename: string }[]>`
				SELECT tablename
				FROM pg_tables
				WHERE schemaname = 'pgboss'
				ORDER BY tablename
			`;

			const tableNames = tables.map((t) => t.tablename);

			expect(tableNames).toContain("archive");
			expect(tableNames).toContain("job");
			expect(tableNames).toContain("queue");
			expect(tableNames).toContain("schedule");
			expect(tableNames).toContain("subscription");
			expect(tableNames).toContain("version");
		},
		TEST_TIMEOUT,
	);

	it(
		"pgboss schema has create_queue and delete_queue functions",
		async () => {
			if (!harness) {
				throw new Error("Postgres test harness did not initialize.");
			}

			const functions = await harness.prisma.$queryRaw<{ proname: string }[]>`
				SELECT proname
				FROM pg_proc
				WHERE pronamespace = 'pgboss'::regnamespace
				ORDER BY proname
			`;

			const functionNames = functions.map((f) => f.proname);

			expect(functionNames).toContain("create_queue");
			expect(functionNames).toContain("delete_queue");
		},
		TEST_TIMEOUT,
	);
});
