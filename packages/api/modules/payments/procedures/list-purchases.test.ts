import {
	getPurchasesByOrganizationId,
	getPurchasesByUserId,
} from "@repo/database";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/database", () => ({
	getPurchasesByOrganizationId: vi.fn(),
	getPurchasesByUserId: vi.fn(),
}));

const mockAuth = {
	api: {
		getSession: vi.fn(),
	},
};

vi.mock("@repo/auth", () => ({ auth: mockAuth }));

type Handler = (ctx: {
	input: { organizationId?: string };
	context: { headers: Headers; user: { id: string } };
}) => Promise<unknown>;

async function getHandler(): Promise<Handler> {
	const { listPurchases } = await import("./list-purchases");
	const handler = (
		listPurchases as unknown as { "~orpc": { handler: Handler } }
	)["~orpc"]?.handler;
	if (!handler) {
		throw new Error("handler not found");
	}
	return handler;
}

const userSession = {
	session: { id: "s1" },
	user: { id: "user-1", role: "user", email: "user@example.com" },
};

describe("listPurchases procedure", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
		mockAuth.api.getSession.mockResolvedValue(userSession);
	});

	it("returns purchases by userId when no organizationId provided", async () => {
		const purchases = [{ id: "purchase-1", userId: "user-1" }];
		vi.mocked(getPurchasesByUserId).mockResolvedValue(purchases as never);

		const handler = await getHandler();
		const result = await handler({
			input: {},
			context: { headers: new Headers(), user: { id: "user-1" } },
		});

		expect(result).toEqual({ purchases });
		expect(getPurchasesByUserId).toHaveBeenCalledWith("user-1");
		expect(getPurchasesByOrganizationId).not.toHaveBeenCalled();
	});

	it("returns purchases by organizationId when provided", async () => {
		const purchases = [{ id: "purchase-2", organizationId: "org-1" }];
		vi.mocked(getPurchasesByOrganizationId).mockResolvedValue(
			purchases as never,
		);

		const handler = await getHandler();
		const result = await handler({
			input: { organizationId: "org-1" },
			context: { headers: new Headers(), user: { id: "user-1" } },
		});

		expect(result).toEqual({ purchases });
		expect(getPurchasesByOrganizationId).toHaveBeenCalledWith("org-1");
		expect(getPurchasesByUserId).not.toHaveBeenCalled();
	});

	it("returns empty list when user has no purchases", async () => {
		vi.mocked(getPurchasesByUserId).mockResolvedValue([]);

		const handler = await getHandler();
		const result = await handler({
			input: {},
			context: { headers: new Headers(), user: { id: "user-1" } },
		});

		expect(result).toEqual({ purchases: [] });
	});
});
