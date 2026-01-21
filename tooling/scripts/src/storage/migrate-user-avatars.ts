/**
 * Migration script: Move user avatars from legacy paths to multi-tenant paths.
 *
 * This script moves existing user avatar files from the legacy `users/{userId}/avatar.png`
 * format to the new multi-tenant `organizations/{orgId}/users/{userId}/avatar.png` format.
 *
 * ## Usage
 *
 * ```bash
 * # Dry run (shows what would be migrated)
 * pnpm --filter @repo/scripts storage:migrate-avatars
 *
 * # Execute migration
 * pnpm --filter @repo/scripts storage:migrate-avatars --execute
 * ```
 *
 * ## What this script does
 *
 * 1. Queries all users with an `image` field that starts with `users/` (legacy path)
 * 2. For each user, finds their active organization (or first membership)
 * 3. Copies the file from the old path to the new org-scoped path
 * 4. Updates the user's `image` field in the database
 * 5. Deletes the old file (only after successful copy and DB update)
 *
 * ## Idempotency
 *
 * - Users with paths already starting with `organizations/` are skipped
 * - If a file doesn't exist at the old path, it's logged and skipped
 * - If the database update fails, the old file is NOT deleted
 *
 * @module @repo/scripts/storage/migrate-user-avatars
 */

import { config } from "@repo/config";
import { db } from "@repo/database";
import {
	buildUserPath,
	getDefaultSupabaseProvider,
	isLegacyPath,
	parsePath,
	shouldUseSupabaseStorage,
} from "@repo/storage";

// ============================================================================
// Types
// ============================================================================

interface MigrationResult {
	userId: string;
	email: string;
	oldPath: string;
	newPath: string | null;
	status: "migrated" | "skipped" | "error";
	reason?: string;
}

interface MigrationSummary {
	total: number;
	migrated: number;
	skipped: number;
	errors: number;
	results: MigrationResult[];
}

// ============================================================================
// Main migration logic
// ============================================================================

/**
 * Migrate user avatars from legacy paths to multi-tenant paths.
 *
 * @param dryRun - If true, only show what would be migrated without making changes
 * @returns Migration summary with results for each user
 */
async function migrateUserAvatars(dryRun = true): Promise<MigrationSummary> {
	console.log(`\n${"=".repeat(60)}`);
	console.log(dryRun ? "🔍 DRY RUN MODE" : "🚀 EXECUTING MIGRATION");
	console.log(`${"=".repeat(60)}\n`);

	const results: MigrationResult[] = [];

	// Find all users with legacy avatar paths
	const usersWithLegacyAvatars = await db.user.findMany({
		where: {
			image: {
				startsWith: "users/",
			},
		},
		select: {
			id: true,
			email: true,
			image: true,
			activeOrganizationId: true,
			members: {
				select: {
					organizationId: true,
				},
				take: 1,
			},
		},
	});

	console.log(
		`Found ${usersWithLegacyAvatars.length} user(s) with legacy avatar paths.\n`,
	);

	if (usersWithLegacyAvatars.length === 0) {
		return {
			total: 0,
			migrated: 0,
			skipped: 0,
			errors: 0,
			results: [],
		};
	}

	// Get storage provider
	const useSupabase = shouldUseSupabaseStorage();
	const provider = useSupabase ? getDefaultSupabaseProvider() : null;
	const bucket = config.storage.bucketNames.avatars;

	if (!provider) {
		console.error(
			"❌ No storage provider configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
		);
		return {
			total: usersWithLegacyAvatars.length,
			migrated: 0,
			skipped: 0,
			errors: usersWithLegacyAvatars.length,
			results: usersWithLegacyAvatars.map((user) => ({
				userId: user.id,
				email: user.email,
				oldPath: user.image ?? "",
				newPath: null,
				status: "error" as const,
				reason: "No storage provider configured",
			})),
		};
	}

	// Process each user
	for (const user of usersWithLegacyAvatars) {
		const oldPath = user.image;

		if (!oldPath) {
			results.push({
				userId: user.id,
				email: user.email,
				oldPath: "",
				newPath: null,
				status: "skipped",
				reason: "No avatar path",
			});
			continue;
		}

		// Validate it's actually a legacy path
		if (!isLegacyPath(oldPath)) {
			results.push({
				userId: user.id,
				email: user.email,
				oldPath,
				newPath: null,
				status: "skipped",
				reason: "Already using multi-tenant path",
			});
			continue;
		}

		// Find the organization to use
		const organizationId =
			user.activeOrganizationId ?? user.members[0]?.organizationId;

		if (!organizationId) {
			results.push({
				userId: user.id,
				email: user.email,
				oldPath,
				newPath: null,
				status: "error",
				reason: "User has no organization membership",
			});
			continue;
		}

		// Parse the old path to extract the file type
		const parsed = parsePath(oldPath);
		let fileType = "avatar.png"; // Default

		if (parsed.type === "legacy") {
			// Extract filename from legacy path like "users/{userId}/avatar.png"
			const parts = parsed.rawPath.split("/");
			fileType = parts[parts.length - 1] ?? "avatar.png";
		}

		// Build the new path
		let newPath: string;
		try {
			newPath = buildUserPath({
				organizationId,
				userId: user.id,
				fileType,
			});
		} catch (e) {
			results.push({
				userId: user.id,
				email: user.email,
				oldPath,
				newPath: null,
				status: "error",
				reason: `Failed to build new path: ${e instanceof Error ? e.message : String(e)}`,
			});
			continue;
		}

		console.log(`\nUser: ${user.email}`);
		console.log(`  Old path: ${oldPath}`);
		console.log(`  New path: ${newPath}`);
		console.log(`  Organization: ${organizationId}`);

		if (dryRun) {
			results.push({
				userId: user.id,
				email: user.email,
				oldPath,
				newPath,
				status: "skipped",
				reason: "Dry run - no changes made",
			});
			console.log("  Status: Would migrate (dry run)");
			continue;
		}

		// Execute the migration for this user
		try {
			// Step 1: Check if old file exists
			const oldFileExists = await provider.exists(oldPath, bucket);
			if (!oldFileExists) {
				results.push({
					userId: user.id,
					email: user.email,
					oldPath,
					newPath,
					status: "error",
					reason: "Old file does not exist in storage",
				});
				console.log("  Status: ❌ Error - old file not found");
				continue;
			}

			// Step 2: Download the old file
			const downloadUrl = await provider.getSignedDownloadUrl(oldPath, {
				bucket,
				expiresIn: 60,
			});

			const response = await fetch(downloadUrl);
			if (!response.ok) {
				throw new Error(
					`Failed to download file: ${response.statusText}`,
				);
			}
			const fileBuffer = Buffer.from(await response.arrayBuffer());

			// Step 3: Upload to new path
			await provider.upload(newPath, fileBuffer, {
				bucket,
				contentType: "image/png",
			});

			// Step 4: Update database
			await db.user.update({
				where: { id: user.id },
				data: { image: newPath },
			});

			// Step 5: Delete old file (only after successful copy and DB update)
			await provider.delete(oldPath, bucket);

			results.push({
				userId: user.id,
				email: user.email,
				oldPath,
				newPath,
				status: "migrated",
			});
			console.log("  Status: ✅ Migrated");
		} catch (e) {
			results.push({
				userId: user.id,
				email: user.email,
				oldPath,
				newPath,
				status: "error",
				reason: e instanceof Error ? e.message : String(e),
			});
			console.log(
				`  Status: ❌ Error - ${e instanceof Error ? e.message : String(e)}`,
			);
		}
	}

	// Generate summary
	const summary: MigrationSummary = {
		total: results.length,
		migrated: results.filter((r) => r.status === "migrated").length,
		skipped: results.filter((r) => r.status === "skipped").length,
		errors: results.filter((r) => r.status === "error").length,
		results,
	};

	// Print summary
	console.log(`\n${"=".repeat(60)}`);
	console.log("MIGRATION SUMMARY");
	console.log(`${"=".repeat(60)}`);
	console.log(`Total users processed: ${summary.total}`);
	console.log(`  ✅ Migrated: ${summary.migrated}`);
	console.log(`  ⏭️  Skipped: ${summary.skipped}`);
	console.log(`  ❌ Errors: ${summary.errors}`);

	if (summary.errors > 0) {
		console.log("\nErrors:");
		for (const result of results.filter((r) => r.status === "error")) {
			console.log(`  - ${result.email}: ${result.reason}`);
		}
	}

	return summary;
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
	const args = process.argv.slice(2);
	const dryRun = !args.includes("--execute");

	if (dryRun) {
		console.log(
			"Running in dry-run mode. Use --execute to perform migration.",
		);
	}

	try {
		await migrateUserAvatars(dryRun);
	} catch (e) {
		console.error("Migration failed:", e);
		process.exit(1);
	} finally {
		await db.$disconnect();
	}
}

main();
