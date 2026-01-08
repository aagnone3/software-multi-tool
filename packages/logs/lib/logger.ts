import { createConsola } from "consola";

export const logger = createConsola({
	level: process.env.LOG_LEVEL
		? Number.parseInt(process.env.LOG_LEVEL, 10)
		: 3, // Info level (0=silent, 1=fatal, 2=error, 3=warn, 4=log, 5=info, 6=success, 7=debug, 8=trace, 9=verbose)
	formatOptions: {
		date: false,
		colors: process.env.NODE_ENV !== "production", // Disable colors in production for better log parsing
	},
	// Ensure logs always go to stdout/stderr in serverless environments
	stdout: process.stdout,
	stderr: process.stderr,
});
