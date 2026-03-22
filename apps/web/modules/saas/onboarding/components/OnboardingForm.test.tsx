import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockReplace, mockUpdateUser, mockClearCache } = vi.hoisted(() => ({
	mockReplace: vi.fn(),
	mockUpdateUser: vi.fn(),
	mockClearCache: vi.fn(),
}));

vi.mock("@shared/hooks/router", () => ({
	useRouter: () => ({ replace: mockReplace }),
}));

vi.mock("@repo/auth/client", () => ({
	authClient: {
		updateUser: mockUpdateUser,
	},
}));

vi.mock("@shared/lib/cache", () => ({
	clearCache: mockClearCache,
}));

const mockSearchParams = vi.hoisted(() => ({
	get: vi.fn().mockReturnValue(null),
}));

vi.mock("next/navigation", () => ({
	useSearchParams: () => mockSearchParams,
}));

// Mock OnboardingStep1 to simplify testing
vi.mock("./OnboardingStep1", () => ({
	OnboardingStep1: ({ onCompleted }: { onCompleted: () => void }) => (
		<div>
			<span>OnboardingStep1</span>
			<button type="button" onClick={onCompleted}>
				Complete
			</button>
		</div>
	),
}));

import { OnboardingForm } from "./OnboardingForm";

describe("OnboardingForm", () => {
	beforeEach(() => {
		mockReplace.mockClear();
		mockUpdateUser.mockClear();
		mockClearCache.mockClear();
		mockSearchParams.get.mockReturnValue(null);
	});

	it("renders the onboarding form", () => {
		render(<OnboardingForm />);
		expect(screen.getByText("Let's get you started")).toBeDefined();
		expect(screen.getByText("OnboardingStep1")).toBeDefined();
	});

	it("calls updateUser and redirects to /app on completion", async () => {
		mockUpdateUser.mockResolvedValue({});
		mockClearCache.mockResolvedValue(undefined);

		render(<OnboardingForm />);
		fireEvent.click(screen.getByText("Complete"));

		await waitFor(() => {
			expect(mockUpdateUser).toHaveBeenCalledWith({
				onboardingComplete: true,
			});
			expect(mockClearCache).toHaveBeenCalled();
			expect(mockReplace).toHaveBeenCalledWith("/app");
		});
	});

	it("redirects to redirectTo param if set", async () => {
		mockSearchParams.get.mockImplementation((key: string) => {
			if (key === "redirectTo") {
				return "/custom-redirect";
			}
			return null;
		});

		mockUpdateUser.mockResolvedValue({});
		mockClearCache.mockResolvedValue(undefined);

		render(<OnboardingForm />);
		fireEvent.click(screen.getByText("Complete"));

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith("/custom-redirect");
		});
	});
});
