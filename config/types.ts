export interface RateLimitConfig {
	/** Maximum number of requests allowed in the time window */
	requests: number;
	/** Time window for rate limiting (e.g., '1h', '1d', '1m') */
	window: string;
}

/**
 * Credit allocation for a subscription plan.
 *
 * Credits are consumed when using tools. When credits run out, users must
 * purchase additional credit packs to continue using paid tools.
 *
 * Design Decision: Credit packs only, no overage billing.
 * - Users have predictable costs (no surprise bills)
 * - Clear value proposition for credit pack purchases
 * - Common pattern in AI tools (Midjourney, stock photos, etc.)
 */
export interface PlanCredits {
	/** Number of credits included in the plan per billing period */
	included: number;
}

/** Unit of measurement for credit costs on variable-cost tools */
export type CreditUnit = "request" | "minute" | "page";

/**
 * A one-time purchasable credit pack.
 *
 * Credit packs allow users to purchase additional credits when they run out
 * or need extra capacity beyond their plan's included credits.
 *
 * Pricing tiers offer volume discounts:
 * - Boost: $0.10/credit (smallest pack, no discount)
 * - Bundle: $0.075/credit (25% discount)
 * - Vault: $0.06/credit (40% discount)
 */
export interface CreditPack {
	/** Unique identifier for the credit pack (e.g., 'boost', 'bundle', 'vault') */
	id: string;
	/** Display name for the credit pack */
	name: string;
	/** Number of credits included in this pack */
	credits: number;
	/** Stripe price ID for this credit pack (one-time payment) */
	priceId: string;
	/** Price in USD (one-time payment) */
	amount: number;
	/** Currency code (e.g., 'USD') */
	currency: string;
}

export interface ToolConfig {
	slug: string;
	name: string;
	description: string;
	icon: string;
	/** Whether the tool is accessible without authentication */
	public: boolean;
	/** Whether the tool is currently enabled */
	enabled: boolean;
	/** Number of credits consumed per use of this tool */
	creditCost: number;
	/** Unit of measurement for variable-cost tools (default: "request") */
	creditUnit?: CreditUnit;
	/** Rate limit configuration for this tool */
	rateLimits?: {
		/** Rate limits for anonymous users */
		anonymous?: RateLimitConfig;
		/** Rate limits for authenticated users */
		authenticated?: RateLimitConfig;
	};
}

export type Config = {
	appName: string;
	tools: {
		/** Registry of all available tools/sub-apps */
		registry: ToolConfig[];
	};
	organizations: {
		enable: boolean;
		enableBilling: boolean;
		enableUsersToCreateOrganizations: boolean;
		requireOrganization: boolean;
		hideOrganization: boolean;
		forbiddenOrganizationSlugs: string[];
	};
	users: {
		enableBilling: boolean;
		enableOnboarding: boolean;
	};
	auth: {
		enableSignup: boolean;
		enableMagicLink: boolean;
		enableSocialLogin: boolean;
		enablePasskeys: boolean;
		enablePasswordLogin: boolean;
		enableTwoFactor: boolean;
		redirectAfterSignIn: string;
		redirectAfterLogout: string;
		sessionCookieMaxAge: number;
	};
	mails: {
		from: string;
	};
	storage: {
		bucketNames: {
			avatars: string;
			contracts: string;
			audio: string;
			expenses: string;
			files: string;
		};
	};
	ui: {
		enabledThemes: Array<"light" | "dark">;
		defaultTheme: Config["ui"]["enabledThemes"][number];
		saas: {
			enabled: boolean;
			useSidebarLayout: boolean;
		};
		marketing: {
			enabled: boolean;
		};
		blog: {
			/** Whether the blog functionality is enabled */
			enabled: boolean;
		};
	};
	contactForm: {
		enabled: boolean;
		to: string;
		subject: string;
	};
	payments: {
		plans: {
			[id: string]: {
				hidden?: boolean;
				isFree?: boolean;
				isEnterprise?: boolean;
				recommended?: boolean;
				/** Credit allocation for this plan */
				credits?: PlanCredits;
				prices?: Array<
					{
						productId: string;
						amount: number;
						currency: string;
						hidden?: boolean;
					} & (
						| {
								type: "recurring";
								interval: "month" | "year" | "week";
								intervalCount?: number;
								trialPeriodDays?: number;
								seatBased?: boolean;
						  }
						| {
								type: "one-time";
						  }
					)
				>;
			};
		};
		/** One-time purchasable credit packs */
		creditPacks?: CreditPack[];
	};
};
