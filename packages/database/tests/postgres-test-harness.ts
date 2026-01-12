import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

import type { PrismaClient } from "@prisma/client";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PostgreSqlContainer } from "@testcontainers/postgresql";

const execFileAsync = promisify(execFile);

type TearDown = () => Promise<void>;

export type PostgresTestHarness = {
	prisma: PrismaClient;
	connectionString: string;
	resetDatabase: () => Promise<void>;
	cleanup: TearDown;
};

const workspaceRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
	"..",
	"..",
);
const prismaDir = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
	"prisma",
);
const prismaSchemaPath = path.join(prismaDir, "schema.prisma");
const generatedClientPath = path.join(
	prismaDir,
	"generated",
	"client",
	"index.js",
);

const TABLES_TO_TRUNCATE = [
	"audit_log",
	"tool_job",
	"rate_limit_entry",
	"ai_chat",
	"purchase",
	"invitation",
	"member",
	"session",
	"account",
	"verification",
	"passkey",
	"twoFactor",
	"organization",
	"user",
] as const;

export async function createPostgresTestHarness(): Promise<PostgresTestHarness> {
	const container = await startContainer();
	const connectionString = container.getConnectionUri();
	const previousDatabaseUrl = process.env.DATABASE_URL;
	const previousDirectUrl = process.env.DIRECT_URL;

	try {
		process.env.DATABASE_URL = connectionString;
		process.env.DIRECT_URL = connectionString;

		await preparePrismaClient(connectionString);
		const prismaModule = await import(
			pathToFileURL(generatedClientPath).href
		);
		const { PrismaClient } =
			prismaModule as typeof import("../prisma/generated/client");
		const prisma = new PrismaClient({
			datasources: {
				db: {
					url: connectionString,
				},
			},
		});
		await prisma.$connect();

		return {
			prisma,
			connectionString,
			resetDatabase: () => truncateAllTables(prisma),
			cleanup: async () => {
				restoreEnvVar("DATABASE_URL", previousDatabaseUrl);
				restoreEnvVar("DIRECT_URL", previousDirectUrl);
				await prisma.$disconnect();
				await container.stop();
			},
		};
	} catch (error) {
		restoreEnvVar("DATABASE_URL", previousDatabaseUrl);
		restoreEnvVar("DIRECT_URL", previousDirectUrl);
		await container.stop().catch(() => {});
		throw error;
	}
}

async function startContainer(): Promise<StartedPostgreSqlContainer> {
	const databaseName = `test_${randomUUID().replace(/-/g, "")}`;
	return new PostgreSqlContainer("postgres:17-alpine")
		.withDatabase(databaseName)
		.withUsername("postgres")
		.withPassword("postgres")
		.start();
}

async function preparePrismaClient(connectionString: string) {
	// Push schema to the test database container
	// Note: We skip generate here because the Prisma client should already be generated
	// during the build process. Regenerating it during tests can cause binary corruption
	// when multiple test processes run concurrently.
	await execFileAsync(
		"pnpm",
		[
			"exec",
			"prisma",
			"db",
			"push",
			"--schema",
			prismaSchemaPath,
			"--skip-generate",
		],
		{
			cwd: workspaceRoot,
			env: {
				...process.env,
				DATABASE_URL: connectionString,
				DIRECT_URL: connectionString,
			},
		},
	);
}

function restoreEnvVar(name: string, previous: string | undefined) {
	if (typeof previous === "string") {
		process.env[name] = previous;
	} else {
		delete process.env[name];
	}
}

async function truncateAllTables(prisma: PrismaClient) {
	const tables = TABLES_TO_TRUNCATE.map((table) => `"${table}"`).join(", ");
	await prisma.$executeRawUnsafe(
		`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`,
	);
}
