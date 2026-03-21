import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { createQueryClient, createQueryKeyWithParams } from "./query-client";

describe("createQueryClient", () => {
	it("returns a QueryClient instance", () => {
		const client = createQueryClient();
		expect(client).toBeInstanceOf(QueryClient);
	});

	it("sets staleTime to 60 seconds", () => {
		const client = createQueryClient();
		const defaults = client.getDefaultOptions();
		expect(defaults.queries?.staleTime).toBe(60 * 1000);
	});

	it("disables retry by default", () => {
		const client = createQueryClient();
		const defaults = client.getDefaultOptions();
		expect(defaults.queries?.retry).toBe(false);
	});
});

describe("createQueryKeyWithParams", () => {
	it("creates key from string base with params", () => {
		const key = createQueryKeyWithParams("users", { page: 1, limit: 10 });
		expect(key[0]).toBe("users");
		expect(key[1]).toContain("page:1");
		expect(key[1]).toContain("limit:10");
	});

	it("creates key from array base with params", () => {
		const key = createQueryKeyWithParams(["users", "list"], { page: 2 });
		expect(key[0]).toBe("users");
		expect(key[1]).toBe("list");
		expect(key[2]).toBe("page:2");
	});

	it("handles empty params", () => {
		const key = createQueryKeyWithParams("data", {});
		expect(key[0]).toBe("data");
		expect(key[1]).toBe("");
	});

	it("handles string values in params", () => {
		const key = createQueryKeyWithParams("search", {
			query: "hello",
			type: "user",
		});
		expect(key[1]).toContain("query:hello");
		expect(key[1]).toContain("type:user");
	});
});
