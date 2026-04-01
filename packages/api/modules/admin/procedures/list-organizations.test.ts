import { ORPCError } from "@orpc/client";
import {
	countAllOrganizations,
	getOrganizationById as getOrganizationByIdFn,
	getOrganizations,
} from "@repo/database";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/database", () => ({
	getOrganizations: vi.fn(),
	countAllOrganizations: vi.fn(),
	getOrganizationById: vi.fn(),
}));

const mockAuth = {
	api: {
		getSession: vi.fn(),
	},
};

vi.mock("@repo/auth", () => ({ auth: mockAuth }));

type ListOrgsHandler = (ctx: {
	input: { query?: string; limit: number; offset: number };
	context: { headers: Headers };
}) => Promise<unknown>;

type GetByIdHandler = (ctx: {
	input: { id: string };
	context: { headers: Headers };
}) => Promise<unknown>;

async function getListOrgsHandler(): Promise<ListOrgsHandler> {
	const { listOrganizations } = await import("./list-organizations");
	const handler = (
		listOrganizations as unknown as {
			"~orpc": { handler: ListOrgsHandler };
		}
	)["~orpc"]?.handler;
	if (!handler) {
		throw new Error("handler not found");
	}
	return handler;
}

async function getGetByIdHandler(): Promise<GetByIdHandler> {
	const { getOrganizationById } = await import("./list-organizations");
	const handler = (
		getOrganizationById as unknown as {
			"~orpc": { handler: GetByIdHandler };
		}
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

describe("listOrganizations procedure", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
		mockAuth.api.getSession.mockResolvedValue(adminSession);
	});

	it("returns organizations and total", async () => {
		const orgs = [{ id: "org-1", name: "Acme" }];
		vi.mocked(getOrganizations).mockResolvedValue(orgs as never);
		vi.mocked(countAllOrganizations).mockResolvedValue(1);

		const handler = await getListOrgsHandler();
		const result = await handler({
			input: { limit: 10, offset: 0 },
			context: { headers: new Headers() },
		});

		expect(result).toEqual({ organizations: orgs, total: 1 });
	});

	it("passes query filter to getOrganizations", async () => {
		vi.mocked(getOrganizations).mockResolvedValue([]);
		vi.mocked(countAllOrganizations).mockResolvedValue(0);

		const handler = await getListOrgsHandler();
		await handler({
			input: { query: "acme", limit: 5, offset: 10 },
			context: { headers: new Headers() },
		});

		expect(getOrganizations).toHaveBeenCalledWith({
			query: "acme",
			limit: 5,
			offset: 10,
		});
	});

	it("returns empty list when no organizations exist", async () => {
		vi.mocked(getOrganizations).mockResolvedValue([]);
		vi.mocked(countAllOrganizations).mockResolvedValue(0);

		const handler = await getListOrgsHandler();
		const result = await handler({
			input: { limit: 10, offset: 0 },
			context: { headers: new Headers() },
		});

		expect(result).toEqual({ organizations: [], total: 0 });
	});
});

describe("getOrganizationById procedure", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
		mockAuth.api.getSession.mockResolvedValue(adminSession);
	});

	it("returns organization when found", async () => {
		const org = { id: "org-1", name: "Acme" };
		vi.mocked(getOrganizationByIdFn).mockResolvedValue(org as never);

		const handler = await getGetByIdHandler();
		const result = await handler({
			input: { id: "org-1" },
			context: { headers: new Headers() },
		});

		expect(result).toEqual(org);
	});

	it("throws NOT_FOUND when organization does not exist", async () => {
		vi.mocked(getOrganizationByIdFn).mockResolvedValue(null);

		const handler = await getGetByIdHandler();
		await expect(
			handler({
				input: { id: "missing" },
				context: { headers: new Headers() },
			}),
		).rejects.toThrow(ORPCError);
	});
});
