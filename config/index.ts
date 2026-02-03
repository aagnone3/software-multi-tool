import type { Config, CreditPack, PlanCredits } from "./types";

export const config = {
	appName: "Software Multitool",
	// Tools/Sub-apps registry
	tools: {
		registry: [
			{
				slug: "bg-remover",
				name: "Background Remover",
				description: "Remove backgrounds from images with AI",
				icon: "image-minus",
				public: true,
				enabled: false,
				creditCost: 1, // 1 credit per image
				rateLimits: {
					anonymous: { requests: 5, window: "1d" },
					authenticated: { requests: 60, window: "1h" },
				},
			},
			{
				slug: "speaker-separation",
				name: "Speaker Separation",
				description:
					"Separate and identify speakers in audio files with timestamps and transcripts",
				icon: "audio-lines",
				public: false, // Requires authentication (no anonymous access)
				enabled: true,
				creditCost: 2, // 2 credits per minute of audio (~$0.015/min AssemblyAI cost)
				creditUnit: "minute",
				rateLimits: {
					anonymous: { requests: 0, window: "1d" }, // Not available for anonymous
					authenticated: { requests: 30, window: "1h" },
				},
			},
			{
				slug: "news-analyzer",
				name: "News Analyzer",
				description: "Analyze news articles for bias and sentiment",
				icon: "newspaper",
				public: true,
				enabled: true,
				creditCost: 1, // 1 credit per article
				rateLimits: {
					anonymous: { requests: 10, window: "1d" },
					authenticated: { requests: 100, window: "1h" },
				},
			},
			{
				slug: "invoice-processor",
				name: "Invoice Processor",
				description:
					"Extract data from invoices using AI for easy accounting integration",
				icon: "receipt",
				public: true,
				enabled: true,
				creditCost: 3, // 3 credits per document
				rateLimits: {
					anonymous: { requests: 5, window: "1d" },
					authenticated: { requests: 50, window: "1h" },
				},
			},
			{
				slug: "contract-analyzer",
				name: "Contract Analyzer",
				description:
					"Analyze contracts for key terms, risks, and obligations",
				icon: "file-text",
				public: true,
				enabled: false,
				creditCost: 5, // 5 credits per page
				creditUnit: "page",
				rateLimits: {
					anonymous: { requests: 3, window: "1d" },
					authenticated: { requests: 30, window: "1h" },
				},
			},
			{
				slug: "feedback-analyzer",
				name: "Customer Feedback Analyzer",
				description:
					"Analyze customer reviews and feedback for sentiment and insights",
				icon: "message-square-text",
				public: true,
				enabled: false,
				creditCost: 1, // 1 credit per analysis
				rateLimits: {
					anonymous: { requests: 10, window: "1d" },
					authenticated: { requests: 100, window: "1h" },
				},
			},
			{
				slug: "expense-categorizer",
				name: "Expense Categorizer",
				description:
					"Automatically categorize expenses for tax and accounting purposes",
				icon: "wallet",
				public: true,
				enabled: false,
				creditCost: 1, // 1 credit per expense
				rateLimits: {
					anonymous: { requests: 10, window: "1d" },
					authenticated: { requests: 100, window: "1h" },
				},
			},
			{
				slug: "meeting-summarizer",
				name: "Meeting Summarizer",
				description:
					"Summarize meeting notes and extract action items automatically",
				icon: "clipboard-list",
				public: true,
				enabled: false,
				creditCost: 2, // 2 credits per summary
				rateLimits: {
					anonymous: { requests: 5, window: "1d" },
					authenticated: { requests: 50, window: "1h" },
				},
			},
			{
				slug: "diagram-editor",
				name: "Diagram Editor",
				description:
					"Create and visualize diagrams with Mermaid syntax and live preview",
				icon: "git-branch",
				public: true,
				enabled: true,
				creditCost: 0, // Client-side only, no credits consumed
				rateLimits: {
					anonymous: { requests: 1000, window: "1d" },
					authenticated: { requests: 10000, window: "1h" },
				},
			},
		],
	},
	// Organizations
	organizations: {
		// Whether organizations are enabled in general
		enable: true,
		// Whether billing for organizations should be enabled (below you can enable it for users instead)
		enableBilling: true,
		// Whether the organization should be hidden from the user (use this for multi-tenant applications)
		hideOrganization: true,
		// Should users be able to create new organizations? Otherwise only admin users can create them
		enableUsersToCreateOrganizations: false,
		// Whether users should be required to be in an organization. This will redirect users to the organization page after sign in
		requireOrganization: true,
		// Define forbidden organization slugs. Make sure to add all paths that you define as a route after /app/... to avoid routing issues
		forbiddenOrganizationSlugs: [
			"new-organization",
			"admin",
			"settings",
			"ai-demo",
			"organization-invitation",
		],
	},
	// Users
	users: {
		// Whether billing should be enabled for users (above you can enable it for organizations instead)
		enableBilling: false,
		// Whether you want the user to go through an onboarding form after signup (can be defined in the OnboardingForm.tsx)
		enableOnboarding: true,
	},
	// Authentication
	auth: {
		// Whether users should be able to create accounts (otherwise users can only be by admins)
		enableSignup: true,
		// Whether users should be able to sign in with a magic link
		enableMagicLink: true,
		// Whether users should be able to sign in with a social provider
		enableSocialLogin: true,
		// Whether users should be able to sign in with a passkey
		enablePasskeys: true,
		// Whether users should be able to sign in with a password
		enablePasswordLogin: true,
		// Whether users should be activate two factor authentication
		enableTwoFactor: true,
		// where users should be redirected after the sign in
		redirectAfterSignIn: "/app",
		// where users should be redirected after logout
		redirectAfterLogout: "/",
		// how long a session should be valid
		sessionCookieMaxAge: 60 * 60 * 24 * 30,
	},
	// Mails
	mails: {
		// the from address for mails
		from: "noreply@softwaremultitool.com",
	},
	// Frontend
	ui: {
		// the themes that should be available in the app
		enabledThemes: ["light", "dark"],
		// the default theme
		defaultTheme: "light",
		// the saas part of the application
		saas: {
			// whether the saas part should be enabled (otherwise all routes will be redirect to the marketing page)
			enabled: true,
			// whether the sidebar layout should be used
			useSidebarLayout: true,
		},
		// the marketing part of the application
		marketing: {
			// whether the marketing features should be enabled (otherwise all routes will be redirect to the saas part)
			enabled: true,
		},
		// blog functionality
		blog: {
			// whether the blog should be enabled (set to false to hide blog links and return 404 for blog routes)
			enabled: false,
		},
	},
	// Storage
	storage: {
		// define the name of the buckets for the different types of files
		bucketNames: {
			/* c8 ignore next */
			avatars: process.env.NEXT_PUBLIC_AVATARS_BUCKET_NAME ?? "avatars",
			/* c8 ignore next */
			contracts:
				process.env.NEXT_PUBLIC_CONTRACTS_BUCKET_NAME ?? "contracts",
			/* c8 ignore next */
			audio: process.env.NEXT_PUBLIC_AUDIO_BUCKET_NAME ?? "audio",
			/* c8 ignore next */
			expenses:
				process.env.NEXT_PUBLIC_EXPENSES_BUCKET_NAME ?? "expenses",
			/* c8 ignore next */
			files: process.env.NEXT_PUBLIC_FILES_BUCKET_NAME ?? "files",
			/* c8 ignore next */
			invoices:
				process.env.NEXT_PUBLIC_INVOICES_BUCKET_NAME ?? "invoices",
		},
	},
	contactForm: {
		// whether the contact form should be enabled
		enabled: true,
		// the email to which the contact form messages should be sent
		to: "anthony@lifewithdata.org",
		// the subject of the email
		subject: "Contact form message",
	},
	// Payments
	payments: {
		// define the products that should be available in the checkout
		// Plans aligned with Stripe products: Free ($0), Starter ($4.99/$49.99), Pro ($19.99/$199.99)
		// Pricing amounts can be overridden via NEXT_PUBLIC_PRICE_* environment variables
		plans: {
			// The free plan is treated differently. It will automatically be assigned if the user has no other plan.
			free: {
				isFree: true,
				credits: {
					included: 10,
				},
			},
			starter: {
				credits: {
					included: 100,
				},
				prices: [
					{
						type: "recurring",
						productId: process.env
							.NEXT_PUBLIC_PRICE_ID_STARTER_MONTHLY as string,
						interval: "month",
						amount:
							Number(
								process.env.NEXT_PUBLIC_PRICE_STARTER_MONTHLY,
							) || 4.99,
						currency: "USD",
						seatBased: true,
						trialPeriodDays: 7,
					},
					{
						type: "recurring",
						productId: process.env
							.NEXT_PUBLIC_PRICE_ID_STARTER_YEARLY as string,
						interval: "year",
						amount:
							Number(
								process.env.NEXT_PUBLIC_PRICE_STARTER_YEARLY,
							) || 49.99,
						currency: "USD",
						seatBased: true,
						trialPeriodDays: 7,
					},
				],
			},
			pro: {
				recommended: true,
				credits: {
					included: 500,
				},
				prices: [
					{
						type: "recurring",
						productId: process.env
							.NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY as string,
						interval: "month",
						amount:
							Number(process.env.NEXT_PUBLIC_PRICE_PRO_MONTHLY) ||
							19.99,
						currency: "USD",
						seatBased: true,
						trialPeriodDays: 7,
					},
					{
						type: "recurring",
						productId: process.env
							.NEXT_PUBLIC_PRICE_ID_PRO_YEARLY as string,
						interval: "year",
						amount:
							Number(process.env.NEXT_PUBLIC_PRICE_PRO_YEARLY) ||
							199.99,
						currency: "USD",
						seatBased: true,
						trialPeriodDays: 7,
					},
				],
			},
		},
		// One-time purchasable credit packs
		// Volume discounts: Boost ($0.10/credit), Bundle ($0.075/credit), Vault ($0.06/credit)
		creditPacks: [
			{
				id: "boost",
				name: "Boost",
				credits: 50,
				priceId: process.env
					.NEXT_PUBLIC_PRICE_ID_CREDIT_PACK_BOOST as string,
				amount: 4.99,
				currency: "USD",
			},
			{
				id: "bundle",
				name: "Bundle",
				credits: 200,
				priceId: process.env
					.NEXT_PUBLIC_PRICE_ID_CREDIT_PACK_BUNDLE as string,
				amount: 14.99,
				currency: "USD",
			},
			{
				id: "vault",
				name: "Vault",
				credits: 500,
				priceId: process.env
					.NEXT_PUBLIC_PRICE_ID_CREDIT_PACK_VAULT as string,
				amount: 29.99,
				currency: "USD",
			},
		],
	},
} as const satisfies Config;

/**
 * Get the credit configuration for a specific plan
 * @param planId - The plan identifier (e.g., 'free', 'pro', 'enterprise')
 * @returns The credit configuration for the plan, or undefined if plan doesn't exist
 */
export function getPlanCredits(planId: string): PlanCredits | undefined {
	const plan =
		config.payments.plans[planId as keyof typeof config.payments.plans];
	return plan?.credits;
}

/**
 * Get the credit cost for a specific tool
 * @param toolSlug - The tool slug identifier (e.g., 'bg-remover', 'speaker-separation')
 * @returns The credit cost for the tool, or undefined if tool doesn't exist
 */
export function getToolCreditCost(toolSlug: string): number | undefined {
	const tool = config.tools.registry.find((t) => t.slug === toolSlug);
	return tool?.creditCost;
}

/**
 * Get all available credit packs
 * @returns Array of all credit packs
 */
export function getCreditPacks(): readonly CreditPack[] {
	return config.payments.creditPacks ?? [];
}

/**
 * Get a specific credit pack by ID
 * @param packId - The credit pack identifier (e.g., 'boost', 'bundle', 'vault')
 * @returns The credit pack configuration, or undefined if not found
 */
export function getCreditPackById(packId: string): CreditPack | undefined {
	return config.payments.creditPacks?.find((pack) => pack.id === packId);
}

/**
 * Get a credit pack by its Stripe price ID
 * @param priceId - The Stripe price ID
 * @returns The credit pack configuration, or undefined if not found
 */
export function getCreditPackByPriceId(
	priceId: string,
): CreditPack | undefined {
	return config.payments.creditPacks?.find(
		(pack) => pack.priceId === priceId,
	);
}

export type { Config, CreditPack, PlanCredits };
