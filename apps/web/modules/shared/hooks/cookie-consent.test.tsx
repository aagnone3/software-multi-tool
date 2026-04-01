import { ConsentProvider } from "@shared/components/ConsentProvider";
import { renderHook } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { useCookieConsent } from "./cookie-consent";

describe("useCookieConsent", () => {
	it("returns context with default values when no provider", () => {
		const { result } = renderHook(() => useCookieConsent());
		expect(result.current.userHasConsented).toBe(false);
		expect(typeof result.current.allowCookies).toBe("function");
		expect(typeof result.current.declineCookies).toBe("function");
	});

	it("returns context from ConsentProvider", () => {
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<ConsentProvider initialConsent={true}>{children}</ConsentProvider>
		);
		const { result } = renderHook(() => useCookieConsent(), { wrapper });
		expect(result.current.userHasConsented).toBe(true);
	});

	it("returns false consent when initialConsent is false", () => {
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<ConsentProvider initialConsent={false}>{children}</ConsentProvider>
		);
		const { result } = renderHook(() => useCookieConsent(), { wrapper });
		expect(result.current.userHasConsented).toBe(false);
	});
});
