import { resolve } from "node:path";
import { config } from "dotenv";
import { z } from "zod";

// Load environment variables from .env.local if it exists
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const envSchema = z.object({
	// Server
	PORT: z.coerce.number().default(4000),
	HOST: z.string().default("0.0.0.0"),
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),

	// Database
	DATABASE_URL: z
		.string()
		.default("postgresql://test:test@localhost:5432/test"),

	// Better Auth
	BETTER_AUTH_SECRET: z.string().default("test-secret-for-ci-environment"),
	BETTER_AUTH_URL: z.string().default("http://localhost:4000"),

	// CORS
	CORS_ORIGIN: z.string().default("http://localhost:3500"),

	// Logging
	LOG_LEVEL: z
		.enum(["fatal", "error", "warn", "info", "debug", "trace"])
		.default("info"),

	// Feature flags
	// Enable pg-boss workers for job processing (replaces cron-based processing)
	USE_PGBOSS_WORKERS: z
		.string()
		.optional()
		.transform((val) => val === "true" || val === "1"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
	const result = envSchema.safeParse(process.env);

	if (!result.success) {
		console.error("❌ Invalid environment variables:");
		console.error(JSON.stringify(result.error.format(), null, 2));
		process.exit(1);
	}

	return result.data;
}

export const env = validateEnv();
