import { afterEach, describe, expect, it, vi } from "vitest";
import { publicProcedure } from "./procedures";

const getSessionMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/auth", () => ({
	auth: {
		handler: vi.fn(),
		api: {
			getSession: getSessionMock,
			generateOpenAPISchema: vi.fn(),
		},
	},
}));

vi.mock("../modules/admin/router", () => ({
	adminRouter: {
		organizations: {
			list: publicProcedure
				.route({
					method: "GET",
					path: "/admin/organizations",
				})
				.handler(() => null),
		},
	},
}));

vi.mock("../modules/users/router", () => ({
	usersRouter: {
		avatarUploadUrl: publicProcedure
			.route({
				method: "POST",
				path: "/users/avatar-upload-url",
			})
			.handler(() => null),
	},
}));

vi.mock("../modules/newsletter/router", () => ({
	newsletterRouter: {},
}));

vi.mock("../modules/contact/router", () => ({
	contactRouter: {},
}));

vi.mock("../modules/organizations/router", () => ({
	organizationsRouter: {},
}));

vi.mock("../modules/payments/router", () => ({
	paymentsRouter: {},
}));

vi.mock("../modules/ai/router", () => ({
	aiRouter: {},
}));

vi.mock("../modules/jobs/router", () => ({
	jobsRouter: {},
}));

vi.mock("../modules/gdpr-exporter/router", () => ({
	gdprRouter: {},
}));

vi.mock("../modules/credits/router", () => ({
	creditsRouter: {},
}));

afterEach(() => {
	getSessionMock.mockReset();
});

describe("api router", () => {
	it("composes module routers under expected keys", async () => {
		const { router } = await import("./router");

		expect(Object.keys(router)).toEqual([
			"admin",
			"newsletter",
			"contact",
			"credits",
			"organizations",
			"users",
			"payments",
			"ai",
			"jobs",
			"gdpr",
		]);
	});

	it("applies the /api prefix to nested procedures", async () => {
		const { router } = await import("./router");

		expect(router.users.avatarUploadUrl["~orpc"].route.path).toBe(
			"/api/users/avatar-upload-url",
		);
		expect(router.admin.organizations.list["~orpc"].route.path).toBe(
			"/api/admin/organizations",
		);
	});
});
