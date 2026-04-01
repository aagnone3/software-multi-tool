import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { metadata } from "./layout";

describe("roi-calculator layout metadata", () => {
	it("has a title", () => {
		expect(typeof metadata.title).toBe("string");
		expect(String(metadata.title)).toContain("ROI Calculator");
	});

	it("has a description", () => {
		expect(typeof metadata.description).toBe("string");
		expect((metadata.description ?? "").length).toBeGreaterThan(20);
	});

	it("has canonical alternates", () => {
		expect(metadata.alternates?.canonical).toBeDefined();
		expect(String(metadata.alternates?.canonical)).toContain(
			"roi-calculator",
		);
	});

	it("has openGraph metadata", () => {
		expect(metadata.openGraph).toBeDefined();
		const og = metadata.openGraph as Record<string, unknown>;
		expect(og["type"]).toBe("website");
		expect(og["url"]).toBeDefined();
	});

	it("has twitter card metadata", () => {
		expect(metadata.twitter).toBeDefined();
		const tw = metadata.twitter as Record<string, unknown>;
		expect(tw["card"]).toBe("summary_large_image");
	});
});

describe("roi-calculator layout component", () => {
	it("renders children", async () => {
		const { default: RoiCalculatorLayout } = await import("./layout");
		const { getByText } = render(
			<RoiCalculatorLayout>
				<div>test content</div>
			</RoiCalculatorLayout>,
		);
		expect(getByText("test content")).toBeDefined();
	});
});
