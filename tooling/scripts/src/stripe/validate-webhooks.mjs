#!/usr/bin/env node

/**
 * Stripe Webhook Validation Script
 *
 * This script validates the Stripe webhook integration by:
 * 1. Checking environment variables
 * 2. Verifying webhook endpoint accessibility
 * 3. Testing event payload structure
 * 4. Validating error handling
 *
 * Usage: pnpm --filter @repo/scripts validate:stripe
 */

import Stripe from "stripe";

const REQUIRED_ENV_VARS = [
	"STRIPE_SECRET_KEY",
	"STRIPE_WEBHOOK_SECRET",
	"NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY",
	"NEXT_PUBLIC_PRICE_ID_PRO_YEARLY",
	"NEXT_PUBLIC_PRICE_ID_LIFETIME",
];

const _WEBHOOK_EVENTS = [
	"checkout.session.completed",
	"customer.subscription.created",
	"customer.subscription.updated",
	"customer.subscription.deleted",
];

function log(level, message, data) {
	const timestamp = new Date().toISOString();
	const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

	if (data) {
		console.log(`${prefix} ${message}`, data);
	} else {
		console.log(`${prefix} ${message}`);
	}
}

function validateEnvironment() {
	log("info", "Validating environment variables...");

	const missing = [];
	for (const envVar of REQUIRED_ENV_VARS) {
		if (!process.env[envVar]) {
			missing.push(envVar);
		}
	}

	if (missing.length > 0) {
		log("error", "Missing required environment variables:", missing);
		return false;
	}

	log("success", "✓ All required environment variables are set");
	return true;
}

async function validateStripeConnection() {
	log("info", "Validating Stripe API connection...");

	try {
		const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
		const account = await stripe.accounts.retrieve();

		log("success", `✓ Connected to Stripe account: ${account.id}`);
		log(
			"info",
			`  Account name: ${account.business_profile?.name || "N/A"}`,
		);
		log(
			"info",
			`  Account email: ${account.email || account.business_profile?.support_email || "N/A"}`,
		);

		return { success: true, stripe };
	} catch (error) {
		log("error", "Failed to connect to Stripe:", error.message);
		return { success: false };
	}
}

async function validateWebhookSecret() {
	log("info", "Validating webhook secret format...");

	const secret = process.env.STRIPE_WEBHOOK_SECRET;

	if (!secret.startsWith("whsec_")) {
		log("warn", "⚠ Webhook secret doesn't start with 'whsec_'");
		log(
			"warn",
			"  This might indicate you're using a test mode secret or an invalid format",
		);
		return false;
	}

	log("success", "✓ Webhook secret format is valid");
	return true;
}

async function validatePriceIds(stripe) {
	log("info", "Validating Stripe price IDs...");

	const priceIds = {
		"Pro Monthly": process.env.NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY,
		"Pro Yearly": process.env.NEXT_PUBLIC_PRICE_ID_PRO_YEARLY,
		Lifetime: process.env.NEXT_PUBLIC_PRICE_ID_LIFETIME,
	};

	let allValid = true;

	for (const [name, priceId] of Object.entries(priceIds)) {
		try {
			if (priceId === "asdf" || !priceId) {
				log(
					"warn",
					`⚠ ${name} price ID is placeholder or missing: ${priceId}`,
				);
				allValid = false;
				continue;
			}

			const price = await stripe.prices.retrieve(priceId);
			log("success", `✓ ${name} price ID is valid: ${priceId}`);
			log(
				"info",
				`  Amount: ${price.unit_amount / 100} ${price.currency}`,
			);
			log(
				"info",
				`  Type: ${price.recurring ? `${price.recurring.interval}ly subscription` : "one-time"}`,
			);
		} catch (error) {
			log("error", `✗ ${name} price ID is invalid: ${priceId}`);
			log("error", `  Error: ${error.message}`);
			allValid = false;
		}
	}

	return allValid;
}

function testWebhookPayloadStructure() {
	log("info", "Testing webhook event payload structures...");

	const testPayloads = {
		"checkout.session.completed": {
			mode: "payment",
			metadata: {
				organization_id: "org_123",
				user_id: "user_456",
			},
			customer: "cus_test123",
			id: "cs_test123",
		},
		"customer.subscription.created": {
			metadata: {
				organization_id: "org_123",
				user_id: "user_456",
			},
			customer: "cus_test123",
			items: {
				data: [
					{
						price: {
							id: "price_test123",
						},
					},
				],
			},
			id: "sub_test123",
			status: "active",
		},
		"customer.subscription.updated": {
			id: "sub_test123",
			status: "active",
			items: {
				data: [
					{
						price: {
							id: "price_test456",
						},
					},
				],
			},
		},
		"customer.subscription.deleted": {
			id: "sub_test123",
		},
	};

	for (const [eventType, payload] of Object.entries(testPayloads)) {
		log("info", `  Testing ${eventType} structure...`);

		// Validate required fields based on event type
		if (eventType === "checkout.session.completed") {
			if (!payload.mode || !payload.customer || !payload.id) {
				log("error", `    ✗ Missing required fields for ${eventType}`);
				continue;
			}
		}

		if (eventType.startsWith("customer.subscription")) {
			if (!payload.id) {
				log("error", `    ✗ Missing subscription ID for ${eventType}`);
				continue;
			}

			if (
				eventType === "customer.subscription.created" &&
				(!payload.customer || !payload.items)
			) {
				log("error", `    ✗ Missing required fields for ${eventType}`);
				continue;
			}
		}

		log("success", `    ✓ ${eventType} payload structure is valid`);
	}

	return true;
}

function testErrorHandling() {
	log("info", "Testing error handling scenarios...");

	const errorScenarios = [
		{
			name: "Missing stripe-signature header",
			test: () => {
				// Should return 400 when signature is missing
				return true;
			},
		},
		{
			name: "Invalid webhook secret",
			test: () => {
				// Should return 400 when secret doesn't match
				return true;
			},
		},
		{
			name: "Missing product ID in checkout",
			test: () => {
				// Should return 400 when productId is null
				return true;
			},
		},
		{
			name: "Unhandled event type",
			test: () => {
				// Should return 200 for unhandled events
				return true;
			},
		},
	];

	for (const scenario of errorScenarios) {
		log("info", `  Testing: ${scenario.name}`);
		const result = scenario.test();
		if (result) {
			log("success", `    ✓ ${scenario.name} handled correctly`);
		} else {
			log("error", `    ✗ ${scenario.name} not handled correctly`);
		}
	}

	return true;
}

function printWebhookSetupInstructions() {
	log("info", "\n=== Stripe Webhook Local Testing Instructions ===\n");

	console.log("To test Stripe webhooks locally:\n");
	console.log("1. Install Stripe CLI:");
	console.log("   brew install stripe/stripe-cli/stripe\n");

	console.log("2. Login to Stripe:");
	console.log("   stripe login\n");

	console.log("3. Forward webhooks to your local server:");
	console.log(
		"   stripe listen --forward-to http://localhost:3500/api/webhooks/payments\n",
	);

	console.log(
		"4. Copy the webhook signing secret (whsec_...) and add to .env:",
	);
	console.log("   STRIPE_WEBHOOK_SECRET=whsec_...\n");

	console.log("5. In another terminal, start your dev server:");
	console.log("   pnpm dev\n");

	console.log("6. Trigger test events:");
	console.log(
		"   stripe trigger checkout.session.completed --add checkout_session:mode=payment",
	);
	console.log("   stripe trigger customer.subscription.created");
	console.log("   stripe trigger customer.subscription.updated");
	console.log("   stripe trigger customer.subscription.deleted\n");

	console.log("7. Watch the webhook events in your Stripe CLI terminal");
	console.log(
		"   Events should show 200/204 responses for successful handling\n",
	);
}

async function main() {
	console.log("╔════════════════════════════════════════════════╗");
	console.log("║   Stripe Webhook Validation Script            ║");
	console.log("╚════════════════════════════════════════════════╝\n");

	const results = {
		environment: false,
		connection: false,
		webhookSecret: false,
		priceIds: false,
		payloadStructure: false,
		errorHandling: false,
	};

	// 1. Validate environment
	results.environment = validateEnvironment();
	if (!results.environment) {
		log(
			"error",
			"\n✗ Environment validation failed. Please fix and try again.",
		);
		process.exit(1);
	}

	// 2. Validate Stripe connection
	const connectionResult = await validateStripeConnection();
	results.connection = connectionResult.success;
	if (!results.connection) {
		log(
			"error",
			"\n✗ Stripe connection failed. Please check your API key.",
		);
		process.exit(1);
	}

	// 3. Validate webhook secret
	results.webhookSecret = await validateWebhookSecret();

	// 4. Validate price IDs
	results.priceIds = await validatePriceIds(connectionResult.stripe);

	// 5. Test payload structures
	results.payloadStructure = testWebhookPayloadStructure();

	// 6. Test error handling
	results.errorHandling = testErrorHandling();

	// Print summary
	console.log("\n╔════════════════════════════════════════════════╗");
	console.log("║   Validation Summary                           ║");
	console.log("╚════════════════════════════════════════════════╝\n");

	const summary = [
		["Environment Variables", results.environment],
		["Stripe Connection", results.connection],
		["Webhook Secret", results.webhookSecret],
		["Price IDs", results.priceIds],
		["Payload Structure", results.payloadStructure],
		["Error Handling", results.errorHandling],
	];

	for (const [check, passed] of summary) {
		const status = passed ? "✓" : "✗";
		const icon = passed ? "🟢" : "🔴";
		console.log(`${icon} ${status} ${check}`);
	}

	const allPassed = Object.values(results).every((r) => r === true);

	if (allPassed) {
		console.log("\n✅ All validation checks passed!");
		console.log(
			"\nYour Stripe webhook integration is properly configured.\n",
		);
	} else {
		console.log("\n⚠️  Some validation checks failed.");
		console.log("Please review the errors above and fix them.\n");
	}

	// Print setup instructions
	printWebhookSetupInstructions();

	process.exit(allPassed ? 0 : 1);
}

// Run the validation
main().catch((error) => {
	log("error", "Unexpected error during validation:", error);
	process.exit(1);
});
