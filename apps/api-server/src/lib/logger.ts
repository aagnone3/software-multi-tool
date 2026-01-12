import { logger as baseLogger } from "@repo/logs";

// Re-export the base logger for api-server use
// Consola doesn't support .child() method like pino
export const logger = baseLogger;
