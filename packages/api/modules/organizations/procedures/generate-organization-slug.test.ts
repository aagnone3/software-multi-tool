import { ORPCError } from "@orpc/client";
import { createProcedureClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getOrganizationBySlugMock } = vi.hoisted(() => ({
	getOrganizationBySlugMock: vi.fn(),
}));

vi.mock("@repo/database", async () => {
	const { z } = await import("zod");
	return {
		getOrganizationBySlug: getOrganizationBySlugMock,
		db: {},
		zodSchemas: {
			AuditActionSchema: z.enum(["CREATE", "READ", "UPDATE", "DELETE"]),
		},
	};
});

import { generateOrganizationSlug } from "./generate-organization-slug";

const createClient = () =>
	createProcedureClient(generateOrganizationSlug, {
		context: { headers: new Headers() },
	});

describe("generateOrganizationSlug", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns base slug when no conflict", async () => {
		getOrganizationBySlugMock.mockResolvedValue(null);
		const client = createClient();

		const result = await client({ name: "Acme Corp" });

		expect(result.slug).toBe("acme-corp");
		expect(getOrganizationBySlugMock).toHaveBeenCalledTimes(1);
	});

	it("appends suffix when base slug is taken", async () => {
		getOrganizationBySlugMock
			.mockResolvedValueOnce({ id: "existing" }) // first call: conflict
			.mockResolvedValueOnce(null); // second call: available

		const result = await createClient()({ name: "Acme Corp" });

		expect(result.slug).toMatch(/^acme-corp-.+$/);
		expect(getOrganizationBySlugMock).toHaveBeenCalledTimes(2);
	});

	it("throws INTERNAL_SERVER_ERROR when all 3 attempts are taken", async () => {
		getOrganizationBySlugMock.mockResolvedValue({ id: "existing" });

		await expect(createClient()({ name: "Acme Corp" })).rejects.toThrow(
			ORPCError,
		);
	});

	it("slugifies special characters", async () => {
		getOrganizationBySlugMock.mockResolvedValue(null);

		const result = await createClient()({ name: "Hello & World!" });

		expect(result.slug).toBe("hello-and-world");
	});
});
