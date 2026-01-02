import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getBaseUrl as exportedGetBaseUrl } from "../index";
import { getBaseUrl } from "./base-url";

const originalEnv = process.env;
const envKeys = [
	"NEXT_PUBLIC_SITE_URL",
	"NEXT_PUBLIC_VERCEL_URL",
	"PORT",
] as const;

describe("getBaseUrl", () => {
	beforeEach(() => {
		process.env = { ...originalEnv };
		for (const key of envKeys) {
			delete process.env[key];
		}
	});

	afterAll(() => {
		process.env = originalEnv;
	});

	it("is re-exported from the package entrypoint", () => {
		expect(exportedGetBaseUrl).toBe(getBaseUrl);
	});

	const scenarios = [
		{
			name: "prefers NEXT_PUBLIC_SITE_URL when defined, even if others exist",
			env: {
				NEXT_PUBLIC_SITE_URL: "https://example.com",
				NEXT_PUBLIC_VERCEL_URL: "ignored.vercel.app",
				PORT: "9999",
			},
			expected: "https://example.com",
		},
		{
			name: "falls back to NEXT_PUBLIC_VERCEL_URL when site url missing",
			env: {
				NEXT_PUBLIC_VERCEL_URL: "my-app.vercel.app",
			},
			expected: "https://my-app.vercel.app",
		},
		{
			name: "falls back to NEXT_PUBLIC_VERCEL_URL when site url is empty",
			env: {
				NEXT_PUBLIC_SITE_URL: "",
				NEXT_PUBLIC_VERCEL_URL: "fallback.vercel.app",
			},
			expected: "https://fallback.vercel.app",
		},
		{
			name: "uses localhost with provided port when only PORT present",
			env: {
				PORT: "4242",
			},
			expected: "http://localhost:4242",
		},
		{
			name: "defaults to localhost:3500 when nothing else applies",
			env: {},
			expected: "http://localhost:3500",
		},
	] as const;

	for (const { name, env, expected } of scenarios) {
		it(name, () => {
			for (const [key, value] of Object.entries(env)) {
				if (value === undefined) {
					delete process.env[key];
				} else {
					process.env[key] = value;
				}
			}

			expect(getBaseUrl()).toBe(expected);
		});
	}
});
