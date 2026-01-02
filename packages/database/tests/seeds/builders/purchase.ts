import type { Prisma } from "../../../prisma/generated/client/index.js";
import { generateId, now } from "../utils.js";

/**
 * Purchase types matching Prisma schema enum
 */
export type PurchaseType = "SUBSCRIPTION" | "ONE_TIME";

/**
 * Default values for creating a Purchase in tests
 */
const PURCHASE_DEFAULTS = {
	id: () => generateId(),
	type: (): PurchaseType => "SUBSCRIPTION",
	customerId: () => `cus_${generateId().slice(0, 14)}`,
	subscriptionId: () => null,
	productId: () => `prod_${generateId().slice(0, 14)}`,
	status: () => "active",
	createdAt: () => now(),
	updatedAt: () => now(),
} as const;

/**
 * Type for purchase creation data without expanded relations
 */
export type PurchaseSeedData = Omit<
	Prisma.PurchaseCreateInput,
	"organization" | "user"
> & {
	organizationId?: string | null;
	userId?: string | null;
};

/**
 * Builds a Purchase object for testing with sensible defaults
 *
 * @param overrides - Partial purchase data to override defaults
 * @returns Purchase creation data ready for Prisma
 *
 * @example
 * ```ts
 * // Create subscription for organization
 * const purchase = buildPurchase({
 *   organizationId: orgId,
 *   subscriptionId: 'sub_123'
 * });
 *
 * // Create one-time purchase for user
 * const oneTime = buildPurchase({
 *   userId: userId,
 *   type: 'ONE_TIME'
 * });
 * ```
 */
export function buildPurchase(
	overrides: Partial<PurchaseSeedData> = {},
): PurchaseSeedData {
	return {
		id: overrides.id ?? PURCHASE_DEFAULTS.id(),
		organizationId: overrides.organizationId ?? null,
		userId: overrides.userId ?? null,
		type: overrides.type ?? PURCHASE_DEFAULTS.type(),
		customerId: overrides.customerId ?? PURCHASE_DEFAULTS.customerId(),
		subscriptionId:
			overrides.subscriptionId ?? PURCHASE_DEFAULTS.subscriptionId(),
		productId: overrides.productId ?? PURCHASE_DEFAULTS.productId(),
		status: overrides.status ?? PURCHASE_DEFAULTS.status(),
		createdAt: overrides.createdAt ?? PURCHASE_DEFAULTS.createdAt(),
		updatedAt: overrides.updatedAt ?? PURCHASE_DEFAULTS.updatedAt(),
	};
}
