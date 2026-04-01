import { describe, expect, it } from "vitest";
import { useLocaleCurrency } from "./locale-currency";

describe("useLocaleCurrency", () => {
	it("returns USD", () => {
		expect(useLocaleCurrency()).toBe("USD");
	});
});
