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
	};
};
