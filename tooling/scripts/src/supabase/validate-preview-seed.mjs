#!/usr/bin/env node

/**
 * Validate Preview Branch Seed
 *
 * This script validates that the Supabase preview branch seed
 * ran correctly by checking for expected test data.
 *
 * Usage:
 *   pnpm --filter @repo/scripts supabase:validate-seed
 *
 * Environment:
 *   DATABASE_URL - Connection string for the preview database
 *
 * Exit codes:
 *   0 - Seed validated successfully
 *   1 - Seed validation failed
 */

import pg from "pg";

const { Client } = pg;

const EXPECTED_USER_ID = "preview_user_001";
const EXPECTED_USER_EMAIL = "test@preview.local";
const EXPECTED_ORG_ID = "preview_org_001";
const EXPECTED_ORG_SLUG = "preview-test-org";
const EXPECTED_SEED_MARKER = "preview_seed_marker";

async function validateSeed() {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		console.error("ERROR: DATABASE_URL environment variable is not set");
		console.error(
			"Set DATABASE_URL to your preview branch database connection string",
		);
		process.exit(1);
	}

	const client = new Client({ connectionString: databaseUrl });

	try {
		console.log("Connecting to preview database...");
		await client.connect();
		console.log("Connected successfully.\n");

		const results = {
			user: false,
			organization: false,
			membership: false,
			seedMarker: false,
		};

		// 1. Check for test user
		console.log("Checking for test user...");
		const userResult = await client.query(
			'SELECT id, email, name FROM "public"."user" WHERE id = $1',
			[EXPECTED_USER_ID],
		);
		if (userResult.rows.length > 0) {
			const user = userResult.rows[0];
			if (user.email === EXPECTED_USER_EMAIL) {
				console.log(
					`  [PASS] Test user found: ${user.name} (${user.email})`,
				);
				results.user = true;
			} else {
				console.log(
					`  [FAIL] User found but email mismatch: ${user.email} (expected: ${EXPECTED_USER_EMAIL})`,
				);
			}
		} else {
			console.log(
				`  [FAIL] Test user not found (id: ${EXPECTED_USER_ID})`,
			);
		}

		// 2. Check for test organization
		console.log("\nChecking for test organization...");
		const orgResult = await client.query(
			'SELECT id, slug, name FROM "public"."organization" WHERE id = $1',
			[EXPECTED_ORG_ID],
		);
		if (orgResult.rows.length > 0) {
			const org = orgResult.rows[0];
			if (org.slug === EXPECTED_ORG_SLUG) {
				console.log(
					`  [PASS] Test org found: ${org.name} (slug: ${org.slug})`,
				);
				results.organization = true;
			} else {
				console.log(
					`  [FAIL] Org found but slug mismatch: ${org.slug} (expected: ${EXPECTED_ORG_SLUG})`,
				);
			}
		} else {
			console.log(`  [FAIL] Test org not found (id: ${EXPECTED_ORG_ID})`);
		}

		// 3. Check for membership
		console.log("\nChecking for membership...");
		const memberResult = await client.query(
			'SELECT role FROM "public"."member" WHERE "userId" = $1 AND "organizationId" = $2',
			[EXPECTED_USER_ID, EXPECTED_ORG_ID],
		);
		if (memberResult.rows.length > 0) {
			const member = memberResult.rows[0];
			console.log(
				`  [PASS] User is member of org with role: ${member.role}`,
			);
			results.membership = true;
		} else {
			console.log(
				"  [FAIL] User is not a member of the test organization",
			);
		}

		// 4. Check for seed marker
		console.log("\nChecking for seed marker...");
		const markerResult = await client.query(
			'SELECT value FROM "public"."verification" WHERE id = $1',
			[EXPECTED_SEED_MARKER],
		);
		if (markerResult.rows.length > 0) {
			const marker = markerResult.rows[0];
			console.log(`  [PASS] Seed marker found: ${marker.value}`);
			results.seedMarker = true;
		} else {
			console.log("  [FAIL] Seed marker not found");
		}

		// Summary
		console.log("\n========================================");
		console.log("VALIDATION SUMMARY");
		console.log("========================================");

		const allPassed = Object.values(results).every((r) => r);
		const passCount = Object.values(results).filter((r) => r).length;
		const totalCount = Object.keys(results).length;

		console.log(`Test User:     ${results.user ? "PASS" : "FAIL"}`);
		console.log(`Organization:  ${results.organization ? "PASS" : "FAIL"}`);
		console.log(`Membership:    ${results.membership ? "PASS" : "FAIL"}`);
		console.log(`Seed Marker:   ${results.seedMarker ? "PASS" : "FAIL"}`);
		console.log("----------------------------------------");
		console.log(`Result: ${passCount}/${totalCount} checks passed`);

		if (allPassed) {
			console.log(
				"\nSeed validation PASSED - Preview branch is ready for testing",
			);
			process.exit(0);
		} else {
			console.log("\nSeed validation FAILED - Check the errors above");
			process.exit(1);
		}
	} catch (error) {
		console.error("\nERROR: Failed to validate seed");
		console.error(error.message);
		process.exit(1);
	} finally {
		await client.end();
	}
}

validateSeed();
