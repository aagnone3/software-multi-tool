#!/usr/bin/env node

import pg from "pg";

const { Client } = pg;

const EXPECTED_USER_ID = process.env.PREVIEW_USER_ID || "preview_user_001";
const EXPECTED_USER_EMAIL =
	process.env.PREVIEW_USER_EMAIL || "test@preview.local";
const EXPECTED_PASSWORD_PREFIX =
	process.env.PREVIEW_USER_PASSWORD_PREFIX || "46eb4f9cb6d62a4d8e23";
const DATABASE_URL =
	process.env.POSTGRES_PRISMA_URL ||
	`postgresql://postgres:postgres@127.0.0.1:${process.env.SUPABASE_DB_PORT || "54322"}/postgres`;

const mode = process.argv[2] || "exists";

if (!["exists", "password"].includes(mode)) {
	console.error(`Unknown mode: ${mode}`);
	console.error(
		"Usage: node ./src/check-local-preview-user.mjs [exists|password]",
	);
	process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL });

async function main() {
	try {
		await client.connect();

		const userResult = await client.query(
			'SELECT email FROM "public"."user" WHERE id = $1',
			[EXPECTED_USER_ID],
		);

		if (userResult.rows.length === 0) {
			console.error(`Preview user not found: ${EXPECTED_USER_ID}`);
			process.exit(1);
		}

		const user = userResult.rows[0];
		if (user.email !== EXPECTED_USER_EMAIL) {
			console.error(
				`Preview user email mismatch: ${user.email} (expected ${EXPECTED_USER_EMAIL})`,
			);
			process.exit(1);
		}

		if (mode === "password") {
			const passwordResult = await client.query(
				'SELECT password FROM "public"."account" WHERE "userId" = $1',
				[EXPECTED_USER_ID],
			);

			if (passwordResult.rows.length === 0) {
				console.error(
					`Preview user account not found: ${EXPECTED_USER_ID}`,
				);
				process.exit(1);
			}

			const password = String(
				passwordResult.rows[0].password || "",
			).replace(/\s+/g, "");
			if (!password.startsWith(EXPECTED_PASSWORD_PREFIX)) {
				console.error("Preview user password hash prefix mismatch");
				process.exit(1);
			}
		}

		console.log(EXPECTED_USER_EMAIL);
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
		process.exit(1);
	} finally {
		await client.end().catch(() => undefined);
	}
}

main();
