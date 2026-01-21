import { describe, expect, it } from "vitest";

import { contentType, size } from "./apple-icon";

describe("apple-icon", () => {
	it("exports correct 180x180 dimensions for Apple touch icon", () => {
		// Apple Touch Icon standard size
		expect(size.width).toBe(180);
		expect(size.height).toBe(180);
	});

	it("exports PNG content type", () => {
		expect(contentType).toBe("image/png");
	});
});
