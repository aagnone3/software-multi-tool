import pg from "pg";

const { Client } = pg;

/**
 * Open a single-use Postgres client using whatever DATABASE_URL is currently
 * in process.env. The caller is responsible for having loaded the env first
 * via `loadEnv()`.
 */
export async function openDb(): Promise<pg.Client> {
	const connStr =
		process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
	if (!connStr) {
		throw new Error(
			"DATABASE_URL not set. Did you forget `pnpm admin env pull --env <target>`?",
		);
	}
	const client = new Client({ connectionString: connStr });
	await client.connect();
	return client;
}
