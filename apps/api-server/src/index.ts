import { db } from "@repo/database";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { startPgBoss, stopPgBoss } from "./lib/pg-boss.js";
import { createServer } from "./lib/server.js";
import { registerWorkers } from "./workers/index.js";

async function main() {
	try {
		// Create and configure server
		const server = await createServer();

		// Test database connection
		await db.$connect();
		logger.info("Database connected successfully");

		// Start pg-boss workers if enabled
		if (env.USE_PGBOSS_WORKERS) {
			logger.info("USE_PGBOSS_WORKERS is enabled, starting pg-boss...");
			await startPgBoss();
			await registerWorkers();
			logger.info("pg-boss workers started successfully");
		} else {
			logger.info(
				"USE_PGBOSS_WORKERS is disabled, skipping pg-boss initialization",
			);
		}

		// Start server
		await server.listen({
			port: env.PORT,
			host: env.HOST,
		});

		logger.info(`Server listening on http://${env.HOST}:${env.PORT}`);
		logger.info(`Environment: ${env.NODE_ENV}`);
		logger.info(`Health check: http://${env.HOST}:${env.PORT}/health`);
		logger.info(`WebSocket: ws://${env.HOST}:${env.PORT}/ws`);
		if (env.USE_PGBOSS_WORKERS) {
			logger.info("pg-boss workers: ENABLED");
		}

		// Graceful shutdown handler
		const shutdownHandler = async (signal: string) => {
			logger.info(`${signal} received, starting graceful shutdown`);

			try {
				// Stop pg-boss first (allows in-flight jobs to complete)
				if (env.USE_PGBOSS_WORKERS) {
					await stopPgBoss();
					logger.info("pg-boss stopped");
				}

				// Close server (stops accepting new connections)
				await server.close();
				logger.info("Server closed");

				// Disconnect database
				await db.$disconnect();
				logger.info("Database disconnected");

				logger.info("Graceful shutdown completed");
				process.exit(0);
			} catch (error) {
				logger.error("Error during shutdown", { error });
				process.exit(1);
			}
		};

		// Register shutdown handlers
		process.on("SIGTERM", () => shutdownHandler("SIGTERM"));
		process.on("SIGINT", () => shutdownHandler("SIGINT"));

		// Handle uncaught errors
		process.on("uncaughtException", (error) => {
			logger.fatal("Uncaught exception", { error });
			process.exit(1);
		});

		process.on("unhandledRejection", (reason, promise) => {
			logger.fatal("Unhandled promise rejection", { reason, promise });
			process.exit(1);
		});
	} catch (error) {
		logger.fatal("Failed to start server", { error });
		process.exit(1);
	}
}

// Start the server
main();
