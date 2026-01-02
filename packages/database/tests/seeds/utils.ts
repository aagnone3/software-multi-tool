import { randomUUID } from "node:crypto";

/**
 * Generates a random UUID v4 string
 */
export function generateId(): string {
	return randomUUID();
}

/**
 * Generates a timestamp for the current time
 */
export function now(): Date {
	return new Date();
}

/**
 * Generates a timestamp offset from now by the specified number of days
 * @param days - Number of days to offset (positive for future, negative for past)
 */
export function daysFromNow(days: number): Date {
	const date = new Date();
	date.setDate(date.getDate() + days);
	return date;
}

/**
 * Generates a unique email address for testing
 * @param prefix - Optional prefix for the email (default: "test")
 */
export function generateEmail(prefix = "test"): string {
	return `${prefix}-${generateId()}@example.com`;
}

/**
 * Generates a unique name for testing
 * @param prefix - Prefix for the name
 */
export function generateName(prefix: string): string {
	return `${prefix}-${generateId().slice(0, 8)}`;
}
