import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { metadata } from "./layout";

describe("use-cases layout metadata", () => {
	it("has a title", () => {
		expect(typeof metadata.title).toBe("string");
		expect(String(metadata.title)).toContain("Use Cases");
	});

	it("has a description", () => {
		expect(typeof metadata.description).toBe("string");
		expect((metadata.description ?? "").length).toBeGreaterThan(20);
	});

	it("has canonical alternates", () => {
		expect(metadata.alternates?.canonical).toBeDefined();
		expect(String(metadata.alternates?.canonical)).toContain("use-cases");
	});

	it("has openGraph metadata", () => {
		expect(metadata.openGraph).toBeDefined();
		const og = metadata.openGraph as Record<string, unknown>;
		expect(og.type).toBe("website");
		expect(og.url).toBeDefined();
	});

	it("has twitter card metadata", () => {
		expect(metadata.twitter).toBeDefined();
		const tw = metadata.twitter as Record<string, unknown>;
		expect(tw.card).toBe("summary_large_image");
	});
});

describe("use-cases layout component", () => {
	it("renders children", async () => {
		const { default: UseCasesLayout } = await import("./layout");
		const { getByText } = render(
			<UseCasesLayout>
				<div>test content</div>
			</UseCasesLayout>,
		);
		expect(getByText("test content")).toBeDefined();
	});
});
