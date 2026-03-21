import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationPreferencesForm } from "./NotificationPreferencesForm";

const mockGetPreferences = vi.fn();
const mockUpdatePreferences = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		notifications: {
			getPreferences: {
				queryOptions: () => ({
					queryKey: ["notifications", "getPreferences"],
					queryFn: mockGetPreferences,
				}),
			},
			updatePreferences: {
				mutationOptions: () => ({
					mutationFn: mockUpdatePreferences,
				}),
			},
		},
	},
}));

vi.mock("sonner", () => ({
	toast: {
		success: (msg: string) => mockToastSuccess(msg),
		error: (msg: string) => mockToastError(msg),
	},
}));

const defaultPreferences = {
	billing: { inApp: true, email: true },
	security: { inApp: true, email: false },
	team: { inApp: false, email: false },
	system: { inApp: true, email: true },
};

function renderComponent() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return render(
		<QueryClientProvider client={queryClient}>
			<NotificationPreferencesForm />
		</QueryClientProvider>,
	);
}

describe("NotificationPreferencesForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetPreferences.mockResolvedValue({
			preferences: defaultPreferences,
		});
		mockUpdatePreferences.mockResolvedValue({});
	});

	it("shows loading state", () => {
		mockGetPreferences.mockImplementation(() => new Promise(() => {}));
		renderComponent();
		expect(screen.getByText("Loading preferences...")).toBeInTheDocument();
	});

	it("shows error state when query fails", async () => {
		mockGetPreferences.mockRejectedValue(new Error("Network error"));
		renderComponent();
		await waitFor(() => {
			expect(
				screen.getByText("Failed to load preferences"),
			).toBeInTheDocument();
		});
	});

	it("renders all 4 notification categories", async () => {
		renderComponent();
		await waitFor(() => {
			expect(screen.getByText("Billing")).toBeInTheDocument();
			expect(screen.getByText("Security")).toBeInTheDocument();
			expect(screen.getByText("Team")).toBeInTheDocument();
			expect(screen.getByText("System")).toBeInTheDocument();
		});
	});

	it("renders In-App and Email channel headers", async () => {
		renderComponent();
		await waitFor(() => {
			expect(screen.getByText("In-App")).toBeInTheDocument();
			expect(screen.getByText("Email")).toBeInTheDocument();
		});
	});

	it("renders switches with correct initial checked state", async () => {
		renderComponent();
		await waitFor(() => {
			const billingInApp = screen.getByRole("switch", {
				name: "Billing In-App notifications",
			});
			expect(billingInApp).toHaveAttribute("data-state", "checked");

			const teamInApp = screen.getByRole("switch", {
				name: "Team In-App notifications",
			});
			expect(teamInApp).toHaveAttribute("data-state", "unchecked");
		});
	});

	it("calls updatePreferences on toggle and shows success toast", async () => {
		renderComponent();
		await waitFor(() => {
			expect(screen.getByText("Billing")).toBeInTheDocument();
		});

		const billingEmailSwitch = screen.getByRole("switch", {
			name: "Billing Email notifications",
		});
		fireEvent.click(billingEmailSwitch);

		await waitFor(() => {
			expect(mockUpdatePreferences).toHaveBeenCalledWith({
				billing: { inApp: true, email: false },
			});
			expect(mockToastSuccess).toHaveBeenCalledWith(
				"Preferences updated",
			);
		});
	});

	it("shows error toast when update fails", async () => {
		mockUpdatePreferences.mockRejectedValue(new Error("Update failed"));
		renderComponent();
		await waitFor(() => {
			expect(screen.getByText("Billing")).toBeInTheDocument();
		});

		const securityEmailSwitch = screen.getByRole("switch", {
			name: "Security Email notifications",
		});
		fireEvent.click(securityEmailSwitch);

		await waitFor(() => {
			expect(mockToastError).toHaveBeenCalledWith(
				"Failed to update preferences",
			);
		});
	});
});
