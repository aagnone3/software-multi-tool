import { describe, expect, it } from "vitest";

import {
	CONTAINER_RUNTIME_REQUIRED_MESSAGE,
	ContainerRuntimeUnavailableError,
	isMissingContainerRuntimeError,
} from "./postgres-test-harness";

describe("postgres test harness runtime ergonomics", () => {
	it("detects the Testcontainers missing-runtime failure", () => {
		expect(
			isMissingContainerRuntimeError(
				new Error(
					"Could not find a working container runtime strategy",
				),
			),
		).toBe(true);
	});

	it("ignores unrelated failures", () => {
		expect(isMissingContainerRuntimeError(new Error("boom"))).toBe(false);
		expect(isMissingContainerRuntimeError("boom")).toBe(false);
	});

	it("wraps the runtime failure in a repo-owned error message", () => {
		const cause = new Error(
			"Could not find a working container runtime strategy",
		);
		const error = new ContainerRuntimeUnavailableError({ cause });

		expect(error.name).toBe("ContainerRuntimeUnavailableError");
		expect(error.message).toBe(CONTAINER_RUNTIME_REQUIRED_MESSAGE);
		expect(error.cause).toBe(cause);
	});
});
