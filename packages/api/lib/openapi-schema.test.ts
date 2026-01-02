import { afterEach, describe, expect, it, vi } from "vitest";

const { mergeResult, mergeMock, isErrorResultMock } = vi.hoisted(() => {
	const output = {
		output: {
			paths: {
				"/api/auth/session": {
					get: { tags: [] },
					post: { tags: [] },
				},
				"/items": {
					get: {},
				},
			},
		},
	};

	return {
		mergeResult: output,
		mergeMock: vi.fn(() => output),
		isErrorResultMock: vi.fn(() => false),
	};
});

vi.mock("openapi-merge", () => ({
	merge: mergeMock,
	isErrorResult: isErrorResultMock,
}));

import { isErrorResult, merge } from "openapi-merge";

import { mergeOpenApiSchemas } from "./openapi-schema";

describe("mergeOpenApiSchemas", () => {
	afterEach(() => {
		mergeMock.mockReturnValue(mergeResult);
		isErrorResultMock.mockReturnValue(false);
	});

	it("prefixes auth routes and tags them as Auth", () => {
		const result = mergeOpenApiSchemas({
			appSchema: { paths: {} } as any,
			authSchema: { paths: {} } as any,
		});

		expect(merge).toHaveBeenCalled();
		expect(result.paths["/api/auth/session"].get.tags).toEqual(["Auth"]);
		expect(result.paths["/items"]).toBeDefined();
	});

	it("returns an empty object when merging fails", () => {
		const errorMarker = Symbol("merge-error");
		(merge as unknown as vi.Mock).mockReturnValueOnce(errorMarker);
		(isErrorResult as unknown as vi.Mock).mockReturnValueOnce(true);

		expect(
			mergeOpenApiSchemas({
				appSchema: { paths: {} } as any,
				authSchema: { paths: {} } as any,
			}),
		).toEqual({});
	});
});
