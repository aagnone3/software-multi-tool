import { getToolCreditCost } from "@repo/config";
import type { Context, Next } from "hono";
import { deductCredits, hasCredits } from "./credits";
import { rateLimitMiddleware } from "./rate-limit-middleware";

/**
 * Options for the credit middleware
 */
export interface CreditMiddlewareOptions {
	/** The tool slug to check credits for */
	toolSlug: string;
	/**
	 * Optional function to calculate variable cost based on request input.
	 * For tools like diarization (cost per minute) or contract-analyzer (cost per page).
	 * If not provided, uses the static creditCost from config.
	 */
	getCost?: (c: Context) => number;
	/** Allow bypassing credit checks in development (default: true) */
	bypassInDev?: boolean;
}

/**
 * Result of a credit check
 */
export interface CreditCheckResult {
	/** Whether the operation is allowed */
	allowed: boolean;
	/** Current available balance */
	balance: number;
	/** Whether this would use overage credits */
	isOverage: boolean;
}

/**
 * Get the organization ID from context
 * This requires the user to be authenticated with an active organization
 */
function getOrganizationId(c: Context): string | null {
	const session = c.get("session");
	return session?.activeOrganizationId ?? null;
}

/**
 * Check if the request is from an authenticated user with an organization
 */
function hasOrganization(c: Context): boolean {
	return !!getOrganizationId(c);
}

/**
 * Credit checking middleware for Hono
 *
 * This middleware:
 * 1. Skips credit check for anonymous users (they use rate limits only)
 * 2. Checks if user has sufficient credits before allowing request
 * 3. Deducts credits after successful request completion
 * 4. Adds credit info headers to response
 *
 * Usage:
 * ```typescript
 * app.post(
 *   "/process",
 *   rateLimitMiddleware({ toolSlug: "invoice-processor" }),
 *   creditMiddleware({ toolSlug: "invoice-processor" }),
 *   handler
 * );
 *
 * // For variable cost tools:
 * app.post(
 *   "/process",
 *   creditMiddleware({
 *     toolSlug: "diarization",
 *     getCost: (c) => {
 *       const body = c.get("parsedBody");
 *       const minutes = Math.ceil(body.durationSeconds / 60);
 *       return minutes * 2; // 2 credits per minute
 *     }
 *   }),
 *   handler
 * );
 * ```
 */
export function creditMiddleware(options: CreditMiddlewareOptions) {
	const { toolSlug, getCost, bypassInDev = true } = options;

	return async (c: Context, next: Next) => {
		// Bypass in development if configured
		if (bypassInDev && process.env.NODE_ENV === "development") {
			await next();
			return;
		}

		// Skip credit check for anonymous users (they use rate limits only)
		if (!hasOrganization(c)) {
			await next();
			return;
		}

		const organizationId = getOrganizationId(c);
		if (!organizationId) {
			// This shouldn't happen due to the check above, but TypeScript needs it
			await next();
			return;
		}

		// Get credit cost - use custom function or config default
		const configCost = getToolCreditCost(toolSlug);
		const cost = getCost ? getCost(c) : (configCost ?? 1);

		// Check if organization has sufficient credits
		const creditCheck = await hasCredits(organizationId, cost);

		// Add credit info headers
		c.header("X-Credits-Balance", creditCheck.balance.toString());
		c.header("X-Credits-Required", cost.toString());

		// If insufficient credits, return 402 Payment Required
		if (!creditCheck.allowed) {
			return c.json(
				{
					error: "Insufficient credits",
					code: "INSUFFICIENT_CREDITS",
					message:
						"You have run out of credits. Please upgrade your plan or purchase more credits.",
					balance: creditCheck.balance,
					required: cost,
				},
				402,
			);
		}

		// Process the request
		await next();

		// Only deduct credits if request was successful (2xx status)
		const status = c.res.status;
		if (status >= 200 && status < 300) {
			try {
				// Get job ID from response if available (set by handler)
				const jobId = c.get("jobId") as string | undefined;

				await deductCredits({
					organizationId,
					amount: cost,
					toolSlug,
					jobId,
					description: `Tool usage: ${toolSlug}`,
				});

				// Update headers with remaining balance after deduction
				c.header(
					"X-Credits-Remaining",
					(creditCheck.balance - cost).toString(),
				);
				c.header("X-Credits-Used", cost.toString());
			} catch (error) {
				// Log error but don't fail the request - credits were already checked
				// This could happen in a race condition, but the user already got their result
				console.error("Failed to deduct credits:", error);
			}
		}
	};
}

/**
 * Combined middleware that applies both rate limiting and credit checking
 *
 * This is a convenience wrapper that applies both middlewares in the correct order:
 * 1. Rate limit check (fast, prevents abuse)
 * 2. Credit check (requires DB lookup)
 *
 * Usage:
 * ```typescript
 * import { toolMiddleware } from "./credit-middleware";
 * import { rateLimitMiddleware } from "./rate-limit-middleware";
 *
 * app.post(
 *   "/process",
 *   toolMiddleware({ toolSlug: "invoice-processor" }),
 *   handler
 * );
 * ```
 */
export function toolMiddleware(
	options: CreditMiddlewareOptions & { bypassRateLimitInDev?: boolean },
) {
	const { bypassRateLimitInDev, ...creditOptions } = options;

	const rateLimiter = rateLimitMiddleware({
		toolSlug: options.toolSlug,
		bypassInDev: bypassRateLimitInDev ?? options.bypassInDev ?? true,
	});

	const creditChecker = creditMiddleware(creditOptions);

	return async (c: Context, next: Next) => {
		// Apply rate limit first
		let rateLimitPassed = false;
		await rateLimiter(c, async () => {
			rateLimitPassed = true;
		});

		if (!rateLimitPassed) {
			// Rate limit middleware already sent response
			return;
		}

		// Then apply credit check
		await creditChecker(c, next);
	};
}
