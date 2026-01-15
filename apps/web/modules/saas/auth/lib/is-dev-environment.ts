/**
 * Check if the current environment is a development/preview environment.
 * This is used to conditionally show development-only features like the quick login button.
 *
 * @param nodeEnv - The NODE_ENV value (defaults to process.env.NODE_ENV)
 * @returns true if in development/preview environment, false in production
 */
export function isDevEnvironment(nodeEnv?: string): boolean {
	const env = nodeEnv ?? process.env.NODE_ENV;
	return env !== "production";
}
