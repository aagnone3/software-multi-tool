import type { Prisma } from "@prisma/client";
import { generateEmail, generateId, now } from "../utils.js";

/**
 * Default values for creating a User in tests
 */
const USER_DEFAULTS = {
	id: () => generateId(),
	name: () => "Test User",
	email: () => generateEmail("user"),
	emailVerified: () => false,
	image: () => null,
	createdAt: () => now(),
	updatedAt: () => now(),
	username: () => null,
	role: () => "user",
	banned: () => false,
	banReason: () => null,
	banExpires: () => null,
	onboardingComplete: () => false,
	paymentsCustomerId: () => null,
	locale: () => "en",
	twoFactorEnabled: () => false,
} as const;

/**
 * Type for user creation data without relations
 */
export type UserSeedData = Omit<
	Prisma.UserCreateInput,
	| "sessions"
	| "accounts"
	| "passkeys"
	| "invitations"
	| "purchases"
	| "members"
	| "twofactors"
	| "aiChats"
>;

/**
 * Builds a User object for testing with sensible defaults
 *
 * @param overrides - Partial user data to override defaults
 * @returns User creation data ready for Prisma
 *
 * @example
 * ```ts
 * // Create with defaults
 * const user = buildUser();
 *
 * // Create with custom email
 * const user = buildUser({ email: 'custom@example.com' });
 *
 * // Create verified user
 * const user = buildUser({ emailVerified: true });
 * ```
 */
export function buildUser(overrides: Partial<UserSeedData> = {}): UserSeedData {
	return {
		id: overrides.id ?? USER_DEFAULTS.id(),
		name: overrides.name ?? USER_DEFAULTS.name(),
		email: overrides.email ?? USER_DEFAULTS.email(),
		emailVerified: overrides.emailVerified ?? USER_DEFAULTS.emailVerified(),
		image: overrides.image ?? USER_DEFAULTS.image(),
		createdAt: overrides.createdAt ?? USER_DEFAULTS.createdAt(),
		updatedAt: overrides.updatedAt ?? USER_DEFAULTS.updatedAt(),
		username: overrides.username ?? USER_DEFAULTS.username(),
		role: overrides.role ?? USER_DEFAULTS.role(),
		banned: overrides.banned ?? USER_DEFAULTS.banned(),
		banReason: overrides.banReason ?? USER_DEFAULTS.banReason(),
		banExpires: overrides.banExpires ?? USER_DEFAULTS.banExpires(),
		onboardingComplete:
			overrides.onboardingComplete ?? USER_DEFAULTS.onboardingComplete(),
		paymentsCustomerId:
			overrides.paymentsCustomerId ?? USER_DEFAULTS.paymentsCustomerId(),
		locale: overrides.locale ?? USER_DEFAULTS.locale(),
		twoFactorEnabled:
			overrides.twoFactorEnabled ?? USER_DEFAULTS.twoFactorEnabled(),
	};
}
