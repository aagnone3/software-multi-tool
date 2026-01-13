#!/usr/bin/env node
/**
 * Verifies that pg-boss can start with the Prisma-managed schema.
 * This script tests that pg-boss works with:
 *   - migrate: false (schema already exists from Prisma migration)
 *   - noSupervisor: true (don't start background workers for this test)
 *
 * Usage:
 *   node scripts/verify-pgboss-schema.mjs
 *
 * Prerequisites:
 *   - pg-boss schema must be created via Prisma migration
 *   - POSTGRES_PRISMA_URL environment variable set
 */

import PgBoss from "pg-boss";

const connectionString =
	process.env.POSTGRES_PRISMA_URL ||
	"postgresql://postgres:postgres@localhost:5432/local_softwaremultitool";

console.log("Verifying pg-boss schema setup...");
console.log(`Connection: ${connectionString.replace(/:[^:@]+@/, ":****@")}`);

async function verify() {
	const boss = new PgBoss({
		connectionString,
		// CRITICAL: These settings verify that Prisma migration created the schema
		migrate: false, // Don't let pg-boss create/modify schema
		noSupervisor: true, // Don't start background workers for this test
	});

	try {
		// Start pg-boss - this will fail if schema is missing
		await boss.start();
		console.log("pg-boss started successfully with migrate: false");

		// Test basic operations
		console.log("Testing queue operations...");

		// Create a test queue
		const queueName = "__test_verify_schema__";

		// Create queue
		await boss.createQueue(queueName);
		console.log(`Created queue: ${queueName}`);

		// Send a job - this tests the partitioning works
		const jobId = await boss.send(queueName, { test: true });
		console.log(`Created test job: ${jobId}`);

		// Verify the job exists by checking queue size
		const size = await boss.getQueueSize(queueName);
		console.log(`Queue size: ${size}`);

		// Clean up - purge jobs first, then delete queue
		await boss.purgeQueue(queueName);
		console.log("Purged test queue jobs");

		await boss.deleteQueue(queueName);
		console.log("Deleted test queue");

		console.log("");
		console.log("VERIFICATION PASSED");
		console.log("pg-boss schema is correctly set up via Prisma migration");
		console.log("pg-boss can start with migrate: false");

		// Stop pg-boss gracefully
		await boss.stop();
		process.exit(0);
	} catch (error) {
		console.error("");
		console.error("VERIFICATION FAILED");
		console.error("pg-boss could not start with the existing schema");
		console.error("Error:", error.message);
		process.exit(1);
	}
}

verify();
