#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

const REPO_ROOT = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../..",
);
const DEFAULT_SEED_FILE = path.join(REPO_ROOT, "supabase", "seed.sql");
const DEFAULT_DATABASE_URL =
	process.env.DATABASE_URL ||
	`postgresql://${process.env.POSTGRES_USER || "postgres"}:${process.env.POSTGRES_PASSWORD || "postgres"}@${process.env.POSTGRES_HOST || "127.0.0.1"}:${process.env.POSTGRES_PORT || process.env.SUPABASE_DB_PORT || "54322"}/${process.env.POSTGRES_DATABASE || "postgres"}`;

async function main() {
	const seedFile = process.env.SEED_FILE || DEFAULT_SEED_FILE;
	const databaseUrl = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;

	const sql = await fs.readFile(seedFile, "utf8");
	const client = new Client({ connectionString: databaseUrl });

	try {
		await client.connect();
		await client.query(sql);
		console.log(`Seeded database from ${seedFile}`);
	} finally {
		await client.end().catch(() => undefined);
	}
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
