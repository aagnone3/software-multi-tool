import { ORPCError } from "@orpc/client";
import { getOrganizationById as getOrganizationByIdFn } from "@repo/database";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/database", () => ({
	getOrganizationById: vi.fn(),
}));

const mockAuth = {
	api: {
		getSession: vi.fn(),
	},
};

vi.mock("@repo/auth", () => ({ auth: mockAuth }));

type Handler = (ctx: {
	input: { id: string };
	context: { headers: Headers };
}) => Promise<unknown>;

async function getHandler(): Promise<Handler> {
	const { findOrganization } = await import("./find-organization");
	const handler = (
		findOrganization as unknown as { "~orpc": { handler: Handler } }
	)["~orpc"]?.handler;
	if (!handler) {
		throw new Error("handler not found");
	}
	return handler;
}

const adminSession = {
	session: { id: "s1" },
	user: { id: "u1", role: "admin", email: "admin@example.com" },
};

describe("findOrganization procedure", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
		mockAuth.api.getSession.mockResolvedValue(adminSession);
	});

	it("returns the organization when found", async () => {
		const org = { id: "org-1", name: "Acme Corp" };
		vi.mocked(getOrganizationByIdFn).mockResolvedValue(org as never);

		const handler = await getHandler();
		const result = await handler({
			input: { id: "org-1" },
			context: { headers: new Headers() },
		});

		expect(result).toEqual(org);
		expect(getOrganizationByIdFn).toHaveBeenCalledWith("org-1");
	});

	it("throws NOT_FOUND when organization does not exist", async () => {
		vi.mocked(getOrganizationByIdFn).mockResolvedValue(null);

		const handler = await getHandler();
		await expect(
			handler({
				input: { id: "nonexistent" },
				context: { headers: new Headers() },
			}),
		).rejects.toThrow(ORPCError);
	});

	it("propagates database errors", async () => {
		vi.mocked(getOrganizationByIdFn).mockRejectedValue(
			new Error("DB connection error"),
		);

		const handler = await getHandler();
		await expect(
			handler({
				input: { id: "org-1" },
				context: { headers: new Headers() },
			}),
		).rejects.toThrow("DB connection error");
	});
});
