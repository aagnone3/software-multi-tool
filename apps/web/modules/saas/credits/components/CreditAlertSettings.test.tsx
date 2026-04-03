import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreditAlertSettings } from "./CreditAlertSettings";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (k: string) => store[k] ?? null,
		setItem: (k: string, v: string) => {
			store[k] = v;
		},
		removeItem: (k: string) => {
			delete store[k];
		},
		clear: () => {
			store = {};
		},
	};
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("CreditAlertSettings", () => {
	beforeEach(() => {
		localStorageMock.clear();
		mockTrack.mockClear();
	});

	it("renders toggle and threshold input", async () => {
		render(<CreditAlertSettings />);
		await waitFor(() => {
			expect(
				screen.getByLabelText("Low credits alert"),
			).toBeInTheDocument();
		});
		expect(
			screen.getByLabelText("Alert threshold (credits)"),
		).toBeInTheDocument();
	});

	it("defaults to enabled with threshold 100", async () => {
		render(<CreditAlertSettings />);
		await waitFor(() => {
			const toggle = screen.getByRole("switch");
			expect(toggle).toBeChecked();
		});
		const input = screen.getByLabelText(
			"Alert threshold (credits)",
		) as HTMLInputElement;
		expect(input.value).toBe("100");
	});

	it("loads persisted settings from localStorage", async () => {
		localStorageMock.setItem(
			"credit-alert-settings",
			JSON.stringify({ enabled: false, threshold: 50 }),
		);
		render(<CreditAlertSettings />);
		await waitFor(() => {
			const toggle = screen.getByRole("switch");
			expect(toggle).not.toBeChecked();
		});
		// Threshold input not rendered when disabled
		expect(
			screen.queryByLabelText("Alert threshold (credits)"),
		).not.toBeInTheDocument();
	});

	it("saves updated threshold on Save click", async () => {
		const user = userEvent.setup({ delay: null });
		render(<CreditAlertSettings />);
		await waitFor(() => {
			expect(
				screen.getByLabelText("Alert threshold (credits)"),
			).toBeInTheDocument();
		});
		const input = screen.getByLabelText("Alert threshold (credits)");
		await user.clear(input);
		await user.type(input, "250");
		await user.click(screen.getByRole("button", { name: /save/i }));
		const stored = JSON.parse(
			localStorageMock.getItem("credit-alert-settings")!,
		);
		expect(stored.threshold).toBe(250);
	});

	it("tracks credit_alert_threshold_saved on Save click", async () => {
		const user = userEvent.setup({ delay: null });
		render(<CreditAlertSettings />);
		await waitFor(() => {
			expect(
				screen.getByLabelText("Alert threshold (credits)"),
			).toBeInTheDocument();
		});
		const input = screen.getByLabelText("Alert threshold (credits)");
		await user.clear(input);
		await user.type(input, "200");
		await user.click(screen.getByRole("button", { name: /save/i }));
		expect(mockTrack).toHaveBeenCalledWith({
			name: "credit_alert_threshold_saved",
			props: { threshold: 200 },
		});
	});

	it("tracks credit_alert_toggled when toggling switch", async () => {
		const user = userEvent.setup({ delay: null });
		render(<CreditAlertSettings />);
		await waitFor(() => {
			expect(screen.getByRole("switch")).toBeInTheDocument();
		});
		await user.click(screen.getByRole("switch"));
		expect(mockTrack).toHaveBeenCalledWith({
			name: "credit_alert_toggled",
			props: { enabled: false },
		});
	});

	it("shows error toast for invalid threshold", async () => {
		const { toast } = await import("sonner");
		const user = userEvent.setup({ delay: null });
		render(<CreditAlertSettings />);
		await waitFor(() => {
			expect(
				screen.getByLabelText("Alert threshold (credits)"),
			).toBeInTheDocument();
		});
		const input = screen.getByLabelText("Alert threshold (credits)");
		await user.clear(input);
		await user.type(input, "-5");
		await user.click(screen.getByRole("button", { name: /save/i }));
		expect(toast.error).toHaveBeenCalled();
	});
});
