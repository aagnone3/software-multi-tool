import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserAvatarUpload } from "./UserAvatarUpload";

const mockUser = vi.hoisted(() => vi.fn());
const mockMutateAsync = vi.hoisted(() => vi.fn());
const mockUseMutation = vi.hoisted(() => vi.fn());

vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: () => ({
		user: mockUser(),
		reloadSession: vi.fn(),
	}),
}));

vi.mock("@tanstack/react-query", () => ({
	useMutation: mockUseMutation,
}));

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		users: {
			avatarUploadUrl: { mutationOptions: vi.fn(() => ({})) },
		},
	},
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("react-dropzone", () => ({
	useDropzone: () => ({
		getRootProps: () => ({}),
		getInputProps: () => ({}),
	}),
}));

vi.mock("@shared/components/UserAvatar", () => ({
	UserAvatar: ({ name }: { name: string }) => <div>avatar-{name}</div>,
}));

vi.mock("@shared/components/Spinner", () => ({
	Spinner: () => <div>loading...</div>,
}));

vi.mock("./CropImageDialog", () => ({
	CropImageDialog: () => null,
}));

describe("UserAvatarUpload", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseMutation.mockReturnValue({ mutateAsync: mockMutateAsync });
	});

	it("renders nothing when no user", () => {
		mockUser.mockReturnValue(null);
		const { container } = render(
			<UserAvatarUpload onSuccess={vi.fn()} onError={vi.fn()} />,
		);
		expect(container.firstChild).toBeNull();
	});

	it("renders avatar when user is present", () => {
		mockUser.mockReturnValue({ id: "u1", name: "Alice", image: null });
		render(<UserAvatarUpload onSuccess={vi.fn()} onError={vi.fn()} />);
		expect(screen.getByText("avatar-Alice")).toBeDefined();
	});

	it("uses empty string for avatar name when user.name is null", () => {
		mockUser.mockReturnValue({ id: "u1", name: null, image: null });
		render(<UserAvatarUpload onSuccess={vi.fn()} onError={vi.fn()} />);
		expect(screen.getByText("avatar-")).toBeDefined();
	});
});
