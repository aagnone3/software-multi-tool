import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrganizationLogoForm } from "./OrganizationLogoForm";

const mockMutateAsync = vi.hoisted(() => vi.fn());
const mockGetRootProps = vi.hoisted(() => vi.fn(() => ({})));
const mockGetInputProps = vi.hoisted(() => vi.fn(() => ({})));
const mockUseActiveOrganization = vi.hoisted(() => vi.fn());
const mockInvalidateQueries = vi.hoisted(() => vi.fn());
const mockRouterRefresh = vi.hoisted(() => vi.fn());

vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: mockUseActiveOrganization,
}));

vi.mock("@tanstack/react-query", async () => {
	const actual = await vi.importActual("@tanstack/react-query");
	return {
		...actual,
		useMutation: vi.fn(() => ({
			mutateAsync: mockMutateAsync,
		})),
		useQueryClient: vi.fn(() => ({
			invalidateQueries: mockInvalidateQueries,
		})),
	};
});

vi.mock("react-dropzone", () => ({
	useDropzone: vi.fn(() => ({
		getRootProps: mockGetRootProps,
		getInputProps: mockGetInputProps,
	})),
}));

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		organizations: {
			createLogoUploadUrl: {
				mutationOptions: vi.fn(() => ({})),
			},
		},
	},
}));

vi.mock("@repo/auth/client", () => ({
	authClient: {
		organization: {
			update: vi.fn().mockResolvedValue({ error: null }),
		},
	},
}));

vi.mock("@saas/organizations/lib/api", () => ({
	organizationListQueryKey: ["organizations"],
}));

vi.mock("next/navigation", () => ({
	useRouter: vi.fn(() => ({
		refresh: mockRouterRefresh,
	})),
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("./OrganizationLogo", () => ({
	OrganizationLogo: ({
		name,
		logoUrl,
	}: {
		name: string;
		logoUrl?: string | null;
	}) => (
		<div data-testid="org-logo" data-name={name} data-logo={logoUrl}>
			{name}
		</div>
	),
}));

vi.mock("../../settings/components/CropImageDialog", () => ({
	CropImageDialog: ({
		open,
		onCrop,
	}: {
		open: boolean;
		onCrop: (blob: Blob | null) => void;
	}) =>
		open ? (
			<button type="button" onClick={() => onCrop(new Blob(["test"]))}>
				Crop
			</button>
		) : null,
}));

vi.mock("@shared/components/Spinner", () => ({
	Spinner: () => <div data-testid="spinner">Loading...</div>,
}));

describe("OrganizationLogoForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders null when no active organization", () => {
		mockUseActiveOrganization.mockReturnValue({
			activeOrganization: null,
			refetchActiveOrganization: vi.fn(),
		});
		const { container } = render(<OrganizationLogoForm />);
		expect(container.firstChild).toBeNull();
	});

	it("renders logo upload when organization exists", () => {
		mockUseActiveOrganization.mockReturnValue({
			activeOrganization: {
				id: "org-1",
				name: "Test Org",
				logo: null,
			},
			refetchActiveOrganization: vi.fn(),
		});

		render(<OrganizationLogoForm />);
		expect(screen.getByTestId("org-logo")).toBeInTheDocument();
		expect(screen.getByText("Organization logo")).toBeInTheDocument();
	});

	it("shows crop dialog after file drop and triggers upload", async () => {
		const mockRefetch = vi.fn();
		mockUseActiveOrganization.mockReturnValue({
			activeOrganization: {
				id: "org-1",
				name: "Test Org",
				logo: null,
			},
			refetchActiveOrganization: mockRefetch,
		});

		mockMutateAsync.mockResolvedValue({
			signedUploadUrl: "https://upload.example.com",
			path: "organizations/org-1/logo.png",
		});

		global.fetch = vi.fn().mockResolvedValue({ ok: true });

		// Simulate the dropzone triggering onDrop
		const { useDropzone } = await import("react-dropzone");
		let capturedOnDrop: ((files: File[]) => void) | undefined;
		(useDropzone as ReturnType<typeof vi.fn>).mockImplementation(
			({ onDrop }: { onDrop: (files: File[]) => void }) => {
				capturedOnDrop = onDrop;
				return {
					getRootProps: mockGetRootProps,
					getInputProps: mockGetInputProps,
				};
			},
		);

		render(<OrganizationLogoForm />);

		// Trigger drop
		if (capturedOnDrop) {
			capturedOnDrop([
				new File(["data"], "logo.png", { type: "image/png" }),
			]);
		}

		// Crop dialog should now be visible
		await waitFor(() => {
			expect(screen.getByText("Crop")).toBeInTheDocument();
		});

		// Click crop
		fireEvent.click(screen.getByText("Crop"));

		await waitFor(() => {
			expect(mockMutateAsync).toHaveBeenCalled();
		});
	});
});
