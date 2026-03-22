import { renderHook } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { SessionContext } from "../lib/session-context";
import { useSession } from "./use-session";

describe("useSession", () => {
	it("throws when used outside SessionProvider", () => {
		expect(() => renderHook(() => useSession())).toThrow(
			"useSession must be used within SessionProvider",
		);
	});

	it("returns context value when inside SessionProvider", () => {
		const mockSession = {
			session: { id: "session-1" } as any,
			user: { id: "user-1", name: "Test" } as any,
			loaded: true,
			reloadSession: vi.fn(),
		};

		const wrapper = ({ children }: { children: React.ReactNode }) =>
			React.createElement(
				SessionContext.Provider,
				{ value: mockSession },
				children,
			);

		const { result } = renderHook(() => useSession(), { wrapper });

		expect(result.current.session).toEqual({ id: "session-1" });
		expect(result.current.user).toEqual({ id: "user-1", name: "Test" });
		expect(result.current.loaded).toBe(true);
		expect(typeof result.current.reloadSession).toBe("function");
	});
});
