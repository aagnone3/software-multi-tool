#!/usr/bin/env node

/**
 * Stages a Prisma migration with advisory lock wrapping.
 * This script automates the workflow from the original .claude/commands/dev:migrate-database.md
 *
 * Usage: pnpm --filter @repo/scripts prisma:stage --name <migration-name>
 */

import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const DATABASE_PATH = resolve(process.cwd(), "../../packages/database");
const SCHEMA_PATH = resolve(DATABASE_PATH, "prisma/schema.prisma");
const MIGRATIONS_PATH = resolve(DATABASE_PATH, "prisma/migrations");

/**
 * @param {string} message
 */
function logInfo(message) {
	console.log(`\x1b[36m[prisma:stage]\x1b[0m ${message}`);
}

/**
 * @param {string} message
 */
function logSuccess(message) {
	console.log(`\x1b[32m[prisma:stage]\x1b[0m ✓ ${message}`);
}

/**
 * @param {string} message
 */
function logError(message) {
	console.error(`\x1b[31m[prisma:stage]\x1b[0m ✗ ${message}`);
}

/**
 * Parse command line arguments
 * @returns {{ name: string | null }}
 */
function parseArgs() {
	const args = process.argv.slice(2);
	const nameIndex = args.indexOf("--name");

	if (nameIndex === -1 || nameIndex === args.length - 1) {
		return { name: null };
	}

	return { name: args[nameIndex + 1] };
}

/**
 * Run prisma format
 */
function formatSchema() {
	try {
		logInfo("Formatting schema...");
		execSync(`pnpm prisma format --schema=${SCHEMA_PATH}`, {
			stdio: "pipe",
			encoding: "utf-8",
		});
		logSuccess("Schema formatted");
	} catch (error) {
		throw new Error(`Schema formatting failed: ${error.message}`);
	}
}

/**
 * Create migration with --create-only
 * @param {string} migrationName
 * @returns {string} Path to the migration file
 */
function createMigration(migrationName) {
	try {
		logInfo(`Creating migration: ${migrationName}...`);

		// Unset any DATABASE_*_URL environment variables to ensure clean state
		const cleanEnv = { ...process.env };
		for (const key of Object.keys(cleanEnv)) {
			if (key.includes("DATABASE") && key.includes("_URL")) {
				delete cleanEnv[key];
			}
		}

		const output = execSync(
			`pnpm prisma migrate dev --create-only --name ${migrationName} --schema=${SCHEMA_PATH}`,
			{
				cwd: DATABASE_PATH,
				stdio: "pipe",
				encoding: "utf-8",
				env: cleanEnv,
			},
		);

		// Check for reset warning
		if (
			output.includes("reset") ||
			output.includes("drop") ||
			output.includes("warn")
		) {
			console.error("\n\x1b[31m[prisma:stage]\x1b[0m OUTPUT:\n", output);
			throw new Error(
				"⚠️  MIGRATION ABORTED: Prisma wants to reset the database!\n" +
					"This likely means the migration state is corrupted and needs resolving before continuing.\n" +
					"Review the output above and resolve the issue manually.",
			);
		}

		logSuccess("Migration created");
		return output;
	} catch (error) {
		if (error.message?.includes("MIGRATION ABORTED")) {
			throw error;
		}
		throw new Error(`Migration creation failed: ${error.message}`);
	}
}

/**
 * Find the most recently created migration directory
 * @returns {string} Migration directory name
 */
function findLatestMigration() {
	try {
		const entries = readdirSync(MIGRATIONS_PATH);

		// Filter out migration_lock.toml and 0_init
		const migrationDirs = entries.filter((entry) => {
			if (entry === "migration_lock.toml" || entry === "0_init") {
				return false;
			}

			const fullPath = resolve(MIGRATIONS_PATH, entry);
			return statSync(fullPath).isDirectory();
		});

		// Sort by name (timestamp prefix ensures chronological order)
		migrationDirs.sort();

		if (migrationDirs.length === 0) {
			throw new Error("No migration directories found");
		}

		return migrationDirs[migrationDirs.length - 1];
	} catch (error) {
		throw new Error(`Failed to find latest migration: ${error.message}`);
	}
}

/**
 * Add transaction-scoped advisory lock to migration SQL
 * @param {string} migrationDir
 *
 * IMPORTANT: We use pg_advisory_xact_lock() (transaction-scoped) WITHOUT explicit
 * BEGIN/COMMIT because Prisma Migrate already wraps each migration in a transaction.
 * Adding explicit BEGIN/COMMIT creates nested transactions which cause failures
 * with the error: "current transaction is aborted, commands ignored until end of
 * transaction block"
 */
function wrapWithAdvisoryLock(migrationDir) {
	try {
		const migrationFile = resolve(
			MIGRATIONS_PATH,
			migrationDir,
			"migration.sql",
		);

		logInfo("Adding advisory lock to migration...");

		// Generate lock ID from migration file path (matching original bash logic)
		const hash = createHash("md5");
		hash.update(migrationFile);
		const hexHash = hash.digest("hex");
		// Remove a-f and take first 10 digits
		const lockId = hexHash.replace(/[a-f]/g, "").substring(0, 10);

		// Read existing migration content
		const migrationSql = readFileSync(migrationFile, "utf-8");

		// Add transaction-scoped advisory lock (NO BEGIN/COMMIT - Prisma handles that)
		// pg_advisory_xact_lock automatically releases when the transaction ends
		const wrappedSql = `-- Acquire transaction-scoped advisory lock for safe concurrent migration
-- (Prisma already wraps migrations in a transaction, so we use pg_advisory_xact_lock
-- which automatically releases when the transaction ends)
SELECT pg_advisory_xact_lock(${lockId}::bigint);

${migrationSql}`;

		writeFileSync(migrationFile, wrappedSql, "utf-8");
		logSuccess("Migration wrapped with advisory lock");

		return migrationFile;
	} catch (error) {
		throw new Error(`Failed to wrap migration: ${error.message}`);
	}
}

async function main() {
	try {
		const { name } = parseArgs();

		if (!name) {
			throw new Error(
				"Migration name is required. Usage: --name <migration-name>\n\n" +
					"Example: pnpm --filter @repo/scripts prisma:stage --name add-user-preferences\n\n" +
					"Tip: Compare with existing migration names in packages/database/prisma/migrations/",
			);
		}

		logInfo("Starting migration staging process...\n");

		// Step 1: Format schema
		formatSchema();

		// Step 2: Create migration
		createMigration(name);

		// Step 3: Find the latest migration directory
		const migrationDir = findLatestMigration();
		logSuccess(`Found migration: ${migrationDir}`);

		// Step 4: Wrap in advisory lock
		const migrationFile = wrapWithAdvisoryLock(migrationDir);

		console.log(
			"\n\x1b[32m[prisma:stage]\x1b[0m ✓ Migration staged successfully!\n",
		);
		console.log(
			`\x1b[36m[prisma:stage]\x1b[0m Migration file: ${migrationFile}`,
		);
		console.log("\x1b[33m[prisma:stage]\x1b[0m ⚠️  NEXT STEPS:");
		console.log(
			"\x1b[33m[prisma:stage]\x1b[0m 1. Review and modify the migration.sql file",
		);
		console.log(
			"\x1b[33m[prisma:stage]\x1b[0m 2. Add data migration queries if needed",
		);
		console.log(
			"\x1b[33m[prisma:stage]\x1b[0m 3. Run: pnpm --filter @repo/database migrate:execute\n",
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		logError(message);
		process.exitCode = 1;
	}
}

main();
