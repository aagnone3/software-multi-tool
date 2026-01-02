import { createProcedureClient, ORPCError } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/auth", () => ({
	auth: {
		handler: vi.fn(),
		api: {
			getSession: getSessionMock,
		},
	},
}));

import { adminProcedure, protectedProcedure } from "./procedures";

const createClient = (procedure: Parameters<typeof createProcedureClient>[0]) =>
	createProcedureClient(procedure, {
		context: {
			headers: new Headers(),
		},
	});

describe("protectedProcedure", () => {
	beforeEach(() => {
		getSessionMock.mockReset();
	});

	it("throws UNAUTHORIZED when no session is found", async () => {
		getSessionMock.mockResolvedValue(null);

		const procedure = protectedProcedure.handler(() => "ok");
		const client = createClient(procedure);
		const call = client();

		await expect(call).rejects.toBeInstanceOf(ORPCError);
		const error = await call.catch((err) => err);
		expect(error).toHaveProperty("code", "UNAUTHORIZED");

		expect(getSessionMock).toHaveBeenCalledTimes(1);
		expect(getSessionMock).toHaveBeenCalledWith(
			expect.objectContaining({
				headers: expect.any(Headers),
			}),
		);
	});

	it("attaches session context when authenticated", async () => {
		const user = { id: "user-1", role: "member" };
		const session = { id: "session-1" };

		getSessionMock.mockResolvedValue({ user, session });

		const procedure = protectedProcedure.handler(({ context }) => context);
		const client = createClient(procedure);

		const result = await client();

		expect(result).toMatchObject({ user, session });
		expect(result.headers).toBeInstanceOf(Headers);
	});
});

describe("adminProcedure", () => {
	beforeEach(() => {
		getSessionMock.mockReset();
	});

	it("rejects non-admin users", async () => {
		const user = { id: "user-2", role: "member" };
		const session = { id: "session-2" };

		getSessionMock.mockResolvedValue({ user, session });

		const procedure = adminProcedure.handler(() => "ok");
		const client = createClient(procedure);
		const call = client();

		await expect(call).rejects.toBeInstanceOf(ORPCError);
		const error = await call.catch((err) => err);
		expect(error).toHaveProperty("code", "FORBIDDEN");
	});

	it("allows admin users to proceed", async () => {
		const user = { id: "user-3", role: "admin" };
		const session = { id: "session-3" };
		const handler = vi.fn(() => "success");

		getSessionMock.mockResolvedValue({ user, session });

		const procedure = adminProcedure.handler(handler);
		const client = createClient(procedure);

		const result = await client();

		expect(handler).toHaveBeenCalledWith(
			expect.objectContaining({
				context: expect.objectContaining({ user, session }),
			}),
		);
		expect(result).toBe("success");
	});
});
