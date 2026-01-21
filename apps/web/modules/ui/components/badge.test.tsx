import { render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
	describe("renders correctly with semantic brand colors", () => {
		it("renders success badge with semantic success colors", () => {
			render(<Badge status="success">Active</Badge>);
			const badge = screen.getByText("Active");

			expect(badge).toBeInTheDocument();
			expect(badge.className).toContain("bg-success/10");
			expect(badge.className).toContain("text-success");
		});

		it("renders info badge with primary brand colors", () => {
			render(<Badge status="info">Info</Badge>);
			const badge = screen.getByText("Info");

			expect(badge).toBeInTheDocument();
			expect(badge.className).toContain("bg-primary/10");
			expect(badge.className).toContain("text-primary");
		});

		it("renders warning badge with highlight brand colors", () => {
			render(<Badge status="warning">Warning</Badge>);
			const badge = screen.getByText("Warning");

			expect(badge).toBeInTheDocument();
			expect(badge.className).toContain("bg-highlight/10");
			expect(badge.className).toContain("text-highlight");
		});

		it("renders error badge with destructive semantic colors", () => {
			render(<Badge status="error">Error</Badge>);
			const badge = screen.getByText("Error");

			expect(badge).toBeInTheDocument();
			expect(badge.className).toContain("bg-destructive/10");
			expect(badge.className).toContain("text-destructive");
		});
	});

	describe("default variant", () => {
		it("uses info as default status", () => {
			render(<Badge>Default</Badge>);
			const badge = screen.getByText("Default");

			expect(badge.className).toContain("bg-primary/10");
			expect(badge.className).toContain("text-primary");
		});
	});

	describe("base styling", () => {
		it("has consistent base styles across all variants", () => {
			render(<Badge status="success">Test</Badge>);
			const badge = screen.getByText("Test");

			expect(badge.className).toContain("inline-block");
			expect(badge.className).toContain("rounded-full");
			expect(badge.className).toContain("px-3");
			expect(badge.className).toContain("py-1");
			expect(badge.className).toContain("text-xs");
			expect(badge.className).toContain("uppercase");
			expect(badge.className).toContain("font-semibold");
			expect(badge.className).toContain("leading-tight");
		});
	});

	describe("custom className", () => {
		it("allows custom className to be applied", () => {
			render(
				<Badge status="info" className="custom-class">
					Custom
				</Badge>,
			);
			const badge = screen.getByText("Custom");

			expect(badge.className).toContain("custom-class");
		});
	});
});
