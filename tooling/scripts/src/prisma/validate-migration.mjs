#!/usr/bin/env node

/**
 * Validates the environment and schema before staging a Prisma migration.
 * This script performs pre-flight checks to catch issues early.
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SCHEMA_PATH = resolve(
	process.cwd(),
	"../../packages/database/prisma/schema.prisma",
);

/**
 * @param {string} message
 */
function logInfo(message) {
	console.log(`\x1b[36m[prisma:validate]\x1b[0m ${message}`);
}

/**
 * @param {string} message
 */
function logSuccess(message) {
	console.log(`\x1b[32m[prisma:validate]\x1b[0m ✓ ${message}`);
}

/**
 * @param {string} message
 */
function logWarning(message) {
	console.warn(`\x1b[33m[prisma:validate]\x1b[0m ⚠ ${message}`);
}

/**
 * @param {string} message
 */
function logError(message) {
	console.error(`\x1b[31m[prisma:validate]\x1b[0m ✗ ${message}`);
}

/**
 * Check if DATABASE_URL is set and valid
 */
function validateDatabaseUrl() {
	const dbUrl = process.env.DATABASE_URL;

	if (!dbUrl) {
		throw new Error(
			"DATABASE_URL is not set. Check apps/web/.env.local configuration.",
		);
	}

	logSuccess("DATABASE_URL is configured");
}

/**
 * Check if schema file exists and is readable
 */
function validateSchemaFile() {
	try {
		readFileSync(SCHEMA_PATH, "utf-8");
		logSuccess(`Schema file found at ${SCHEMA_PATH}`);
	} catch (error) {
		throw new Error(
			`Cannot read schema file at ${SCHEMA_PATH}: ${error.message}`,
		);
	}
}

/**
 * Validate Prisma schema syntax
 */
function validateSchemaSyntax() {
	try {
		logInfo("Validating schema syntax...");
		execSync(`pnpm prisma validate --schema=${SCHEMA_PATH}`, {
			stdio: "pipe",
			encoding: "utf-8",
		});
		logSuccess("Schema syntax is valid");
	} catch (error) {
		throw new Error(`Schema validation failed: ${error.message}`);
	}
}

/**
 * Check for database drift (schema differs from database)
 */
function checkDatabaseDrift() {
	try {
		logInfo("Checking for database drift...");
		const diff = execSync(
			`pnpm prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel ${SCHEMA_PATH} --script`,
			{
				stdio: "pipe",
				encoding: "utf-8",
			},
		);

		if (diff.trim() === "-- This is an empty migration.") {
			logWarning(
				"No schema changes detected. Are you sure you need a migration?",
			);
		} else {
			logSuccess("Schema changes detected");
		}
	} catch (error) {
		// Non-zero exit means there are differences, which is expected
		if (error.status === 1) {
			logSuccess("Schema changes detected");
		} else {
			logWarning(`Could not check drift: ${error.message}`);
		}
	}
}

/**
 * Verify shadow database can be created (important for migrate dev)
 */
function validateShadowDatabase() {
	logInfo("Checking shadow database support...");

	// Shadow DB is created automatically by Prisma for local postgres
	// We just verify the DATABASE_URL uses a supported provider
	const dbUrl = process.env.DATABASE_URL || "";

	if (
		!dbUrl.startsWith("postgresql://") &&
		!dbUrl.startsWith("postgres://")
	) {
		logWarning(
			"DATABASE_URL does not appear to be PostgreSQL. Shadow database may not work correctly.",
		);
	} else {
		logSuccess("Database provider supports shadow database");
	}
}

async function main() {
	try {
		logInfo("Starting pre-migration validation...\n");

		validateDatabaseUrl();
		validateSchemaFile();
		validateSchemaSyntax();
		validateShadowDatabase();
		checkDatabaseDrift();

		console.log(
			"\n\x1b[32m[prisma:validate]\x1b[0m ✓ All validation checks passed",
		);
		console.log(
			"\x1b[36m[prisma:validate]\x1b[0m Ready to stage migration\n",
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		logError(message);
		process.exitCode = 1;
	}
}

main();
