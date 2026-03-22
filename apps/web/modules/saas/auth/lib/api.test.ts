import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authClientMock = vi.hoisted(() => ({
	getSession: vi.fn(),
	listAccounts: vi.fn(),
	passkey: {
		listUserPasskeys: vi.fn(),
	},
}));

vi.mock("@repo/auth/client", () => ({
	authClient: authClientMock,
}));

vi.mock("@repo/config", () => ({
	config: { ui: { saas: { enabled: true } } },
}));

import {
	sessionQueryKey,
	userAccountQueryKey,
	userPasskeyQueryKey,
	useSessionQuery,
	useUserAccountsQuery,
	useUserPasskeysQuery,
} from "./api";

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return ({ children }: { children: React.ReactNode }) =>
		React.createElement(
			QueryClientProvider,
			{ client: queryClient },
			children,
		);
}

describe("query keys", () => {
	it("sessionQueryKey is stable", () => {
		expect(sessionQueryKey).toEqual(["user", "session"]);
	});
	it("userAccountQueryKey is stable", () => {
		expect(userAccountQueryKey).toEqual(["user", "accounts"]);
	});
	it("userPasskeyQueryKey is stable", () => {
		expect(userPasskeyQueryKey).toEqual(["user", "passkeys"]);
	});
});

describe("useSessionQuery", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns session on success", async () => {
		const session = { user: { id: "u1" } };
		authClientMock.getSession.mockResolvedValue({
			data: session,
			error: null,
		});

		const { result } = renderHook(() => useSessionQuery(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual(session);
	});

	it("throws on error", async () => {
		authClientMock.getSession.mockResolvedValue({
			data: null,
			error: { message: "Session expired" },
		});

		const { result } = renderHook(() => useSessionQuery(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect((result.current.error as Error).message).toBe("Session expired");
	});
});

describe("useUserAccountsQuery", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns accounts on success", async () => {
		const accounts = [{ id: "acc-1", provider: "google" }];
		authClientMock.listAccounts.mockResolvedValue({
			data: accounts,
			error: null,
		});

		const { result } = renderHook(() => useUserAccountsQuery(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual(accounts);
	});

	it("throws on error", async () => {
		const err = new Error("Fetch failed");
		authClientMock.listAccounts.mockResolvedValue({
			data: null,
			error: err,
		});

		const { result } = renderHook(() => useUserAccountsQuery(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isError).toBe(true));
	});
});

describe("useUserPasskeysQuery", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns passkeys on success", async () => {
		const passkeys = [{ id: "pk-1", name: "TouchID" }];
		authClientMock.passkey.listUserPasskeys.mockResolvedValue({
			data: passkeys,
			error: null,
		});

		const { result } = renderHook(() => useUserPasskeysQuery(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual(passkeys);
	});

	it("throws on error", async () => {
		const err = new Error("Passkey error");
		authClientMock.passkey.listUserPasskeys.mockResolvedValue({
			data: null,
			error: err,
		});

		const { result } = renderHook(() => useUserPasskeysQuery(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isError).toBe(true));
	});
});
