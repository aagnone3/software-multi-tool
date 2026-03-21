import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	update: vi.fn(),
	invalidateQueries: vi.fn(),
	refresh: vi.fn(),
	toastSuccess: vi.fn(),
	toastError: vi.fn(),
}));

vi.mock("@repo/auth/client", () => ({
	authClient: {
		organization: {
			update: mocks.update,
		},
	},
}));

vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => ({
		activeOrganization: { id: "org1", name: "Acme Corp", slug: "acme" },
	}),
}));

vi.mock("@saas/organizations/lib/api", () => ({
	organizationListQueryKey: ["organizations"],
}));

vi.mock("@saas/shared/components/SettingsItem", () => ({
	SettingsItem: ({
		title,
		children,
	}: {
		title: string;
		children: React.ReactNode;
	}) => (
		<div>
			<h3>{title}</h3>
			{children}
		</div>
	),
}));

vi.mock("@shared/hooks/router", () => ({
	useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock("@tanstack/react-query", () => ({
	useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));

vi.mock("sonner", () => ({
	toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

import { ChangeOrganizationNameForm } from "./ChangeOrganizationNameForm";

describe("ChangeOrganizationNameForm", () => {
	it("renders with current org name", () => {
		render(<ChangeOrganizationNameForm />);
		const input = screen.getByRole("textbox") as HTMLInputElement;
		expect(input.value).toBe("Acme Corp");
	});

	it("calls update on valid submit", async () => {
		mocks.update.mockResolvedValueOnce({ error: null });
		const user = userEvent.setup();
		render(<ChangeOrganizationNameForm />);

		const input = screen.getByRole("textbox");
		await user.clear(input);
		await user.type(input, "New Corp Name");

		const button = screen.getByRole("button", { name: /save/i });
		await user.click(button);

		await waitFor(() => {
			expect(mocks.update).toHaveBeenCalledWith({
				organizationId: "org1",
				data: { name: "New Corp Name" },
			});
		});
	});

	it("shows error toast on failure", async () => {
		mocks.update.mockResolvedValueOnce({ error: new Error("Failed") });
		const user = userEvent.setup();
		render(<ChangeOrganizationNameForm />);

		const input = screen.getByRole("textbox");
		await user.clear(input);
		await user.type(input, "New Corp Name");

		await user.click(screen.getByRole("button", { name: /save/i }));

		await waitFor(() => {
			expect(mocks.toastError).toHaveBeenCalled();
		});
	});
});
