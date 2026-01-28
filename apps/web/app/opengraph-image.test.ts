import { describe, expect, it } from "vitest";

import { alt, contentType, size } from "./opengraph-image";

describe("opengraph-image", () => {
	it("exports correct image dimensions", () => {
		expect(size.width).toBe(1200);
		expect(size.height).toBe(630);
	});

	it("exports PNG content type", () => {
		expect(contentType).toBe("image/png");
	});

	it("exports alt text with app name", () => {
		expect(alt).toBe("AI Multitool");
	});
});
