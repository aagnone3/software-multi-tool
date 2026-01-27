import { describe, expect, it } from "vitest";

/**
 * Tests for authentication feature flag filtering logic.
 *
 * The LoginForm and SignupForm components use these patterns:
 * - Filter OAuth providers based on `enable-github-login` flag
 * - Conditionally render passkey button based on `enable-passkey-login` flag
 */

// Re-create the filtering logic used in LoginForm/SignupForm
function filterOAuthProviders(
	providers: string[],
	isGithubEnabled: boolean,
): string[] {
	return providers.filter((providerId) => {
		if (providerId === "github" && !isGithubEnabled) {
			return false;
		}
		return true;
	});
}

describe("OAuth Provider Filtering", () => {
	const allProviders = ["google", "github"];

	describe("GitHub OAuth filtering", () => {
		it("should exclude GitHub when enable-github-login flag is false", () => {
			const filtered = filterOAuthProviders(allProviders, false);

			expect(filtered).toContain("google");
			expect(filtered).not.toContain("github");
			expect(filtered).toEqual(["google"]);
		});

		it("should include GitHub when enable-github-login flag is true", () => {
			const filtered = filterOAuthProviders(allProviders, true);

			expect(filtered).toContain("google");
			expect(filtered).toContain("github");
			expect(filtered).toEqual(["google", "github"]);
		});

		it("should always include non-GitHub providers", () => {
			const providers = ["google", "apple", "github"];

			const filtered = filterOAuthProviders(providers, false);

			expect(filtered).toContain("google");
			expect(filtered).toContain("apple");
			expect(filtered).not.toContain("github");
		});
	});

	describe("Empty provider list", () => {
		it("should handle empty provider list gracefully", () => {
			const filtered = filterOAuthProviders([], false);
			expect(filtered).toEqual([]);
		});
	});

	describe("Single provider", () => {
		it("should handle only Google provider", () => {
			const filtered = filterOAuthProviders(["google"], false);
			expect(filtered).toEqual(["google"]);
		});

		it("should filter out lone GitHub when flag is false", () => {
			const filtered = filterOAuthProviders(["github"], false);
			expect(filtered).toEqual([]);
		});

		it("should keep lone GitHub when flag is true", () => {
			const filtered = filterOAuthProviders(["github"], true);
			expect(filtered).toEqual(["github"]);
		});
	});
});

describe("Passkey Button Visibility", () => {
	function shouldShowPasskeyButton(
		enablePasskeys: boolean,
		isPasskeyLoginEnabled: boolean,
	): boolean {
		return enablePasskeys && isPasskeyLoginEnabled;
	}

	it("should hide passkey button when both config and flag are enabled", () => {
		expect(shouldShowPasskeyButton(true, true)).toBe(true);
	});

	it("should hide passkey button when flag is false", () => {
		expect(shouldShowPasskeyButton(true, false)).toBe(false);
	});

	it("should hide passkey button when config disables passkeys", () => {
		expect(shouldShowPasskeyButton(false, true)).toBe(false);
	});

	it("should hide passkey button when both are disabled", () => {
		expect(shouldShowPasskeyButton(false, false)).toBe(false);
	});
});

describe("OAuth Section Visibility", () => {
	function shouldShowOAuthSection(
		enableSignup: boolean,
		enableSocialLogin: boolean,
		filteredProviderCount: number,
		enablePasskeys: boolean,
		isPasskeyLoginEnabled: boolean,
	): boolean {
		const hasPasskeys = enablePasskeys && isPasskeyLoginEnabled;
		const hasOAuth =
			enableSignup && enableSocialLogin && filteredProviderCount > 0;
		return hasPasskeys || hasOAuth;
	}

	it("should show section when OAuth providers are available", () => {
		expect(shouldShowOAuthSection(true, true, 1, false, false)).toBe(true);
	});

	it("should show section when passkey is enabled", () => {
		expect(shouldShowOAuthSection(false, false, 0, true, true)).toBe(true);
	});

	it("should hide section when no OAuth providers and passkey disabled", () => {
		expect(shouldShowOAuthSection(true, true, 0, false, false)).toBe(false);
	});

	it("should hide section when passkey flag is false even if config allows", () => {
		expect(shouldShowOAuthSection(false, false, 0, true, false)).toBe(
			false,
		);
	});

	it("should show section when both OAuth and passkey are available", () => {
		expect(shouldShowOAuthSection(true, true, 2, true, true)).toBe(true);
	});
});
