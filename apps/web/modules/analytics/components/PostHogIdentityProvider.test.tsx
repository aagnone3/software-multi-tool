import { render } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const posthogIdentifyMock = vi.hoisted(() => vi.fn());
const posthogGroupMock = vi.hoisted(() => vi.fn());
const posthogResetMock = vi.hoisted(() => vi.fn());

vi.mock("posthog-js", () => ({
	default: {
		identify: posthogIdentifyMock,
		group: posthogGroupMock,
		reset: posthogResetMock,
	},
}));

import { PostHogIdentityProvider } from "./PostHogIdentityProvider";

describe("PostHogIdentityProvider", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.unstubAllEnvs();
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
	});

	it("does nothing when NEXT_PUBLIC_POSTHOG_KEY is not set", () => {
		render(<PostHogIdentityProvider userId="user-1" />);
		expect(posthogIdentifyMock).not.toHaveBeenCalled();
		expect(posthogGroupMock).not.toHaveBeenCalled();
	});

	it("calls posthog.identify with userId and traits", () => {
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "test-key");
		render(
			<PostHogIdentityProvider
				userId="user-1"
				email="test@example.com"
				name="Test User"
			/>,
		);
		expect(posthogIdentifyMock).toHaveBeenCalledWith("user-1", {
			email: "test@example.com",
			name: "Test User",
		});
	});

	it("calls posthog.group when organizationId is provided", () => {
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "test-key");
		render(
			<PostHogIdentityProvider
				userId="user-1"
				organizationId="org-1"
				planId="pro"
			/>,
		);
		expect(posthogGroupMock).toHaveBeenCalledWith("organization", "org-1", {
			plan: "pro",
		});
	});

	it("does not call posthog.group when organizationId is null", () => {
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "test-key");
		render(
			<PostHogIdentityProvider userId="user-1" organizationId={null} />,
		);
		expect(posthogGroupMock).not.toHaveBeenCalled();
	});

	it("calls posthog.reset on unmount", () => {
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "test-key");
		const { unmount } = render(<PostHogIdentityProvider userId="user-1" />);
		unmount();
		expect(posthogResetMock).toHaveBeenCalled();
	});

	it("omits null email and name from identify traits", () => {
		vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "test-key");
		render(
			<PostHogIdentityProvider
				userId="user-1"
				email={null}
				name={null}
			/>,
		);
		expect(posthogIdentifyMock).toHaveBeenCalledWith("user-1", {});
	});
});
