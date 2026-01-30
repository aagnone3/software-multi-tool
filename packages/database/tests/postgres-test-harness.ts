import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { PrismaClient } from "@prisma/client";
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

const TABLES_TO_TRUNCATE = [
	"credit_transaction",
	"credit_balance",
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
	const previousPrismaUrl = process.env.POSTGRES_PRISMA_URL;
	const previousNonPoolingUrl = process.env.POSTGRES_URL_NON_POOLING;

	try {
		process.env.POSTGRES_PRISMA_URL = connectionString;
		process.env.POSTGRES_URL_NON_POOLING = connectionString;

		await preparePrismaClient(connectionString);
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
				restoreEnvVar("POSTGRES_PRISMA_URL", previousPrismaUrl);
				restoreEnvVar(
					"POSTGRES_URL_NON_POOLING",
					previousNonPoolingUrl,
				);
				await prisma.$disconnect();
				await container.stop();
			},
		};
	} catch (error) {
		restoreEnvVar("POSTGRES_PRISMA_URL", previousPrismaUrl);
		restoreEnvVar("POSTGRES_URL_NON_POOLING", previousNonPoolingUrl);
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
	// Deploy migrations to the test database container
	// Note: We use `migrate deploy` instead of `db push` to ensure raw SQL migrations
	// are properly applied. The Prisma client should already be generated during the
	// build process.
	await execFileAsync(
		"pnpm",
		["exec", "prisma", "migrate", "deploy", "--schema", prismaSchemaPath],
		{
			cwd: workspaceRoot,
			env: {
				...process.env,
				POSTGRES_PRISMA_URL: connectionString,
				POSTGRES_URL_NON_POOLING: connectionString,
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
