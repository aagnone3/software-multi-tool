#!/usr/bin/env node
/**
 * Initializes pg-boss tables in the local PostgreSQL database.
 * This script is used to generate the pg-boss schema that we then introspect with Prisma.
 *
 * Usage:
 *   node scripts/init-pgboss-schema.mjs
 *
 * Prerequisites:
 *   - Local PostgreSQL running on port 5432
 *   - POSTGRES_PRISMA_URL environment variable set (or using default)
 */

import PgBoss from "pg-boss";

const connectionString =
	process.env.POSTGRES_PRISMA_URL ||
	"postgresql://postgres:postgres@localhost:5432/local_aimultitool";

console.log("Initializing pg-boss schema...");
console.log(`Connection: ${connectionString.replace(/:[^:@]+@/, ":****@")}`);

async function init() {
	const boss = new PgBoss({
		connectionString,
		// pg-boss v10+ uses list partitioning
		noSupervisor: true,
	});

	try {
		// Start pg-boss - this creates the schema and all tables
		await boss.start();
		console.log("pg-boss schema created successfully!");
		console.log("Tables created in pgboss schema:");
		console.log("  - pgboss.version");
		console.log("  - pgboss.queue");
		console.log("  - pgboss.schedule");
		console.log("  - pgboss.subscription");
		console.log(
			"  - pgboss.job (partitioned - partitions created dynamically per queue)",
		);
		console.log("  - pgboss.archive");
		console.log("");
		console.log(
			"Now run: pnpm --filter @repo/database prisma db pull --schema=./prisma/schema.prisma",
		);

		// Stop pg-boss gracefully
		await boss.stop();
	} catch (error) {
		console.error("Failed to initialize pg-boss schema:", error);
		process.exit(1);
	}
}

init();
