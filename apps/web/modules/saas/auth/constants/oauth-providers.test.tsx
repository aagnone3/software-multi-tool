import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { type OAuthProvider, oAuthProviders } from "./oauth-providers";

describe("oAuthProviders", () => {
	it("has google and github providers", () => {
		expect(oAuthProviders.google).toBeDefined();
		expect(oAuthProviders.github).toBeDefined();
	});

	it("google has correct name", () => {
		expect(oAuthProviders.google.name).toBe("Google");
	});

	it("github has correct name", () => {
		expect(oAuthProviders.github.name).toBe("Github");
	});

	it("google icon renders SVG", () => {
		const Icon = oAuthProviders.google.icon;
		const { container } = render(<Icon />);
		expect(container.querySelector("svg")).toBeTruthy();
	});

	it("github icon renders SVG", () => {
		const Icon = oAuthProviders.github.icon;
		const { container } = render(<Icon />);
		expect(container.querySelector("svg")).toBeTruthy();
	});

	it("OAuthProvider type includes expected keys", () => {
		const key: OAuthProvider = "google";
		expect(oAuthProviders[key]).toBeDefined();
	});
});
