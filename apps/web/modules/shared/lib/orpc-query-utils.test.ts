import { describe, expect, it } from "vitest";
import { orpc } from "./orpc-query-utils";

describe("orpc", () => {
	it("is defined (tanstack query utils initialised)", () => {
		expect(orpc).toBeDefined();
	});
});
