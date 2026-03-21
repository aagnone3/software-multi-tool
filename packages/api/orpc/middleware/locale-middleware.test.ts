import { createProcedureClient, os } from "@orpc/server";
import { describe, expect, it } from "vitest";
import { localeMiddleware } from "./locale-middleware";

const createLocaleClient = () => {
	const procedure = os
		.$context<{ headers: Headers }>()
		.use(localeMiddleware)
		.handler(({ context }) => ({
			locale: (context as Record<string, unknown>).locale,
		}));

	return createProcedureClient(procedure, {
		context: { headers: new Headers() },
	});
};

describe("localeMiddleware", () => {
	it("always injects 'en' locale into context", async () => {
		const client = createLocaleClient();
		const result = await client();
		expect(result.locale).toBe("en");
	});

	it("still provides 'en' locale when Accept-Language header is present", async () => {
		const procedure = os
			.$context<{ headers: Headers }>()
			.use(localeMiddleware)
			.handler(({ context }) => ({
				locale: (context as Record<string, unknown>).locale,
			}));

		const client = createProcedureClient(procedure, {
			context: {
				headers: new Headers({ "accept-language": "fr-FR,fr;q=0.9" }),
			},
		});

		const result = await client();
		expect(result.locale).toBe("en");
	});
});
