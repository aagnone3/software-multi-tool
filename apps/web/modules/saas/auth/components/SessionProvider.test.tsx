"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSession } from "../hooks/use-session";
import { SessionProvider } from "./SessionProvider";

// Mock useSessionQuery
vi.mock("../lib/api", () => ({
	sessionQueryKey: ["user", "session"],
	useSessionQuery: vi.fn(),
}));

// Mock authClient
vi.mock("@repo/auth/client", () => ({
	authClient: {
		getSession: vi.fn(),
	},
}));

import { authClient } from "@repo/auth/client";
import { useSessionQuery } from "../lib/api";

function TestConsumer() {
	const ctx = useSession();
	return (
		<div>
			<span data-testid="loaded">{String(ctx.loaded)}</span>
			<span data-testid="user">{ctx.user?.name ?? "null"}</span>
		</div>
	);
}

function Wrapper({ children }: { children: React.ReactNode }) {
	const qc = new QueryClient();
	return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("SessionProvider", () => {
	beforeEach(() => {
		vi.mocked(useSessionQuery).mockReturnValue({
			data: undefined,
		} as ReturnType<typeof useSessionQuery>);
	});

	it("provides session context with null user when no session data", () => {
		render(
			<Wrapper>
				<SessionProvider>
					<TestConsumer />
				</SessionProvider>
			</Wrapper>,
		);
		expect(screen.getByTestId("user").textContent).toBe("null");
	});

	it("provides loaded=false when no initial session", () => {
		render(
			<Wrapper>
				<SessionProvider>
					<TestConsumer />
				</SessionProvider>
			</Wrapper>,
		);
		expect(screen.getByTestId("loaded").textContent).toBe("false");
	});

	it("provides loaded=true when session data is present", async () => {
		vi.mocked(useSessionQuery).mockReturnValue({
			data: { session: { id: "s1" }, user: { id: "u1", name: "Alice" } },
		} as ReturnType<typeof useSessionQuery>);

		render(
			<Wrapper>
				<SessionProvider>
					<TestConsumer />
				</SessionProvider>
			</Wrapper>,
		);
		expect(screen.getByTestId("loaded").textContent).toBe("true");
		expect(screen.getByTestId("user").textContent).toBe("Alice");
	});

	it("reloadSession calls authClient.getSession", async () => {
		vi.mocked(authClient.getSession).mockResolvedValue({
			data: { session: { id: "s2" }, user: { id: "u2", name: "Bob" } },
			error: null,
		} as Awaited<ReturnType<typeof authClient.getSession>>);

		let reloadFn: (() => Promise<void>) | undefined;

		function CaptureReload() {
			const ctx = useSession();
			reloadFn = ctx.reloadSession;
			return null;
		}

		render(
			<Wrapper>
				<SessionProvider>
					<CaptureReload />
				</SessionProvider>
			</Wrapper>,
		);

		await act(async () => {
			await reloadFn?.();
		});
		expect(authClient.getSession).toHaveBeenCalledWith({
			query: { disableCookieCache: true },
		});
	});
});
