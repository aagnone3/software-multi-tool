import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@saas/auth/lib/server", () => ({
	getSession: vi
		.fn()
		.mockResolvedValue({ user: { id: "user-1", name: "Test" } }),
}));

vi.mock("next/navigation", () => ({
	redirect: vi.fn(),
}));

vi.mock("@saas/settings/components/ChangeEmailForm", () => ({
	ChangeEmailForm: () => (
		<div data-testid="change-email-form">ChangeEmailForm</div>
	),
}));
vi.mock("@saas/settings/components/ChangeNameForm", () => ({
	ChangeNameForm: () => (
		<div data-testid="change-name-form">ChangeNameForm</div>
	),
}));
vi.mock("@saas/settings/components/UserAvatarForm", () => ({
	UserAvatarForm: () => (
		<div data-testid="user-avatar-form">UserAvatarForm</div>
	),
}));
vi.mock("@saas/shared/components/SettingsList", () => ({
	SettingsList: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

let AccountSettingsPage: () => Promise<React.ReactElement>;
let generateMetadata: () => Promise<{ title: string }>;

beforeAll(async () => {
	const mod = await import("./page");
	AccountSettingsPage = mod.default as typeof AccountSettingsPage;
	generateMetadata = mod.generateMetadata as typeof generateMetadata;
});

describe("AccountSettingsPage (general)", () => {
	it("renders account setting forms", async () => {
		render(await AccountSettingsPage());
		expect(screen.getByTestId("user-avatar-form")).toBeInTheDocument();
		expect(screen.getByTestId("change-name-form")).toBeInTheDocument();
		expect(screen.getByTestId("change-email-form")).toBeInTheDocument();
	});

	it("generateMetadata returns correct title", async () => {
		const meta = await generateMetadata();
		expect(meta.title).toBe("Account settings");
	});
});
