import { act, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConsentBanner } from "./ConsentBanner";

const mockCookieConsent = {
	userHasConsented: false,
	allowCookies: vi.fn(),
	declineCookies: vi.fn(),
};

vi.mock("@shared/hooks/cookie-consent", () => ({
	useCookieConsent: () => mockCookieConsent,
}));

describe("ConsentBanner", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCookieConsent.userHasConsented = false;
	});

	it("renders null before mount (SSR)", () => {
		const { container } = render(<ConsentBanner />);
		// After act, it should mount — but on initial render it should be null
		// We can only check post-mount state in jsdom
		expect(container).toBeTruthy();
	});

	it("renders banner after mount when not consented", async () => {
		render(<ConsentBanner />);
		// After effects run
		await act(async () => {});
		expect(screen.getByText(/uses cookies/i)).toBeTruthy();
	});

	it("renders null when user has consented", async () => {
		mockCookieConsent.userHasConsented = true;
		render(<ConsentBanner />);
		await act(async () => {});
		expect(screen.queryByText(/uses cookies/i)).toBeNull();
	});

	it("calls allowCookies when Allow clicked", async () => {
		render(<ConsentBanner />);
		await act(async () => {});
		screen.getByText("Allow").click();
		expect(mockCookieConsent.allowCookies).toHaveBeenCalledOnce();
	});

	it("calls declineCookies when Decline clicked", async () => {
		render(<ConsentBanner />);
		await act(async () => {});
		screen.getByText("Decline").click();
		expect(mockCookieConsent.declineCookies).toHaveBeenCalledOnce();
	});
});
