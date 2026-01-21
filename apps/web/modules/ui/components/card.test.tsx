import { render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it } from "vitest";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./card";

describe("Card", () => {
	describe("Card component", () => {
		it("renders with brand-consistent styling", () => {
			render(<Card data-testid="card">Content</Card>);
			const card = screen.getByTestId("card");

			expect(card).toBeInTheDocument();
			expect(card.className).toContain("rounded-2xl");
			expect(card.className).toContain("border");
			expect(card.className).toContain("bg-card");
			expect(card.className).toContain("text-card-foreground");
			expect(card.className).toContain("shadow-sm");
		});

		it("allows custom className", () => {
			render(
				<Card data-testid="card" className="custom-class">
					Content
				</Card>,
			);
			const card = screen.getByTestId("card");

			expect(card.className).toContain("custom-class");
		});
	});

	describe("CardHeader", () => {
		it("renders with proper spacing", () => {
			render(<CardHeader data-testid="header">Header</CardHeader>);
			const header = screen.getByTestId("header");

			expect(header.className).toContain("flex");
			expect(header.className).toContain("flex-col");
			expect(header.className).toContain("space-y-1.5");
			expect(header.className).toContain("p-6");
			expect(header.className).toContain("pb-4");
		});
	});

	describe("CardTitle", () => {
		it("renders with proper typography", () => {
			render(<CardTitle data-testid="title">Title</CardTitle>);
			const title = screen.getByTestId("title");

			expect(title.className).toContain("font-semibold");
			expect(title.className).toContain("text-xl");
			expect(title.className).toContain("leading-none");
		});
	});

	describe("CardDescription", () => {
		it("renders with muted foreground color", () => {
			render(
				<CardDescription data-testid="desc">
					Description
				</CardDescription>,
			);
			const desc = screen.getByTestId("desc");

			expect(desc.className).toContain("text-muted-foreground");
			expect(desc.className).toContain("text-sm");
		});
	});

	describe("CardContent", () => {
		it("renders with proper padding", () => {
			render(<CardContent data-testid="content">Content</CardContent>);
			const content = screen.getByTestId("content");

			expect(content.className).toContain("p-6");
			expect(content.className).toContain("pt-0");
		});
	});

	describe("CardFooter", () => {
		it("renders with flex layout", () => {
			render(<CardFooter data-testid="footer">Footer</CardFooter>);
			const footer = screen.getByTestId("footer");

			expect(footer.className).toContain("flex");
			expect(footer.className).toContain("items-center");
			expect(footer.className).toContain("p-6");
			expect(footer.className).toContain("pt-0");
		});
	});

	describe("full card composition", () => {
		it("renders complete card structure correctly", () => {
			render(
				<Card data-testid="full-card">
					<CardHeader>
						<CardTitle>Card Title</CardTitle>
						<CardDescription>Card description text</CardDescription>
					</CardHeader>
					<CardContent>Main content here</CardContent>
					<CardFooter>Footer actions</CardFooter>
				</Card>,
			);

			expect(screen.getByTestId("full-card")).toBeInTheDocument();
			expect(screen.getByText("Card Title")).toBeInTheDocument();
			expect(
				screen.getByText("Card description text"),
			).toBeInTheDocument();
			expect(screen.getByText("Main content here")).toBeInTheDocument();
			expect(screen.getByText("Footer actions")).toBeInTheDocument();
		});
	});
});
