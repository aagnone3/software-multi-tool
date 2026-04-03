import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signInSocialMock = vi.hoisted(() => vi.fn());
const mockTrack = vi.fn();
let invitationIdValue: string | null = null;

vi.mock("@repo/auth/client", () => ({
	authClient: {
		signIn: {
			social: signInSocialMock,
		},
	},
}));

vi.mock("@repo/config", () => ({
	config: {
		auth: {
			redirectAfterSignIn: "/app",
		},
	},
}));

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("nuqs", async (importOriginal) => {
	// biome-ignore lint/suspicious/noExplicitAny: test mock
	const actual = (await importOriginal()) as any;
	return {
		...actual,
		useQueryState: () => [invitationIdValue, vi.fn()],
	};
});

import { SocialSigninButton } from "./SocialSigninButton";

describe("SocialSigninButton", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockTrack.mockReset();
		invitationIdValue = null;
		Object.defineProperty(window, "location", {
			value: { origin: "https://test.example.com" },
			writable: true,
		});
	});

	it("renders the provider button", () => {
		render(<SocialSigninButton provider="github" />);
		expect(screen.getByRole("button")).toBeDefined();
	});

	it("calls signIn.social with provider and callback when clicked", () => {
		render(<SocialSigninButton provider="github" />);
		fireEvent.click(screen.getByRole("button"));
		expect(signInSocialMock).toHaveBeenCalledWith({
			provider: "github",
			callbackURL: "https://test.example.com/app",
		});
	});

	it("uses invitation path when invitationId is present", () => {
		invitationIdValue = "inv-123";
		render(<SocialSigninButton provider="google" />);
		fireEvent.click(screen.getByRole("button"));
		expect(signInSocialMock).toHaveBeenCalledWith({
			provider: "google",
			callbackURL:
				"https://test.example.com/organization-invitation/inv-123",
		});
	});

	it("tracks social_signin_clicked on button click", () => {
		render(<SocialSigninButton provider="github" />);
		fireEvent.click(screen.getByRole("button"));
		expect(mockTrack).toHaveBeenCalledWith({
			name: "social_signin_clicked",
			props: { provider: "github", has_invitation: false },
		});
	});

	it("tracks has_invitation=true when invitationId is set", () => {
		invitationIdValue = "inv-abc";
		render(<SocialSigninButton provider="google" />);
		fireEvent.click(screen.getByRole("button"));
		expect(mockTrack).toHaveBeenCalledWith({
			name: "social_signin_clicked",
			props: { provider: "google", has_invitation: true },
		});
	});
});
