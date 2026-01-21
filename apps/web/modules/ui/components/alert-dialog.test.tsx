import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./alert-dialog";

describe("AlertDialog", () => {
	describe("AlertDialogContent", () => {
		it("renders with theme-based overlay using backdrop blur", async () => {
			render(
				<AlertDialog defaultOpen>
					<AlertDialogContent data-testid="content">
						<AlertDialogHeader>
							<AlertDialogTitle>Test Title</AlertDialogTitle>
							<AlertDialogDescription>
								Test Description
							</AlertDialogDescription>
						</AlertDialogHeader>
					</AlertDialogContent>
				</AlertDialog>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("content")).toBeInTheDocument();
			});

			const content = screen.getByTestId("content");
			expect(content.className).toContain("border");
			expect(content.className).toContain("bg-background");
			expect(content.className).toContain("shadow-lg");
		});
	});

	describe("AlertDialogHeader", () => {
		it("renders with proper spacing and alignment", async () => {
			render(
				<AlertDialog defaultOpen>
					<AlertDialogContent>
						<AlertDialogHeader data-testid="header">
							<AlertDialogTitle>Title</AlertDialogTitle>
						</AlertDialogHeader>
					</AlertDialogContent>
				</AlertDialog>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("header")).toBeInTheDocument();
			});

			const header = screen.getByTestId("header");
			expect(header.className).toContain("flex");
			expect(header.className).toContain("flex-col");
			expect(header.className).toContain("space-y-2");
		});
	});

	describe("AlertDialogTitle", () => {
		it("renders with proper typography", async () => {
			render(
				<AlertDialog defaultOpen>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle data-testid="title">
								Test Title
							</AlertDialogTitle>
						</AlertDialogHeader>
					</AlertDialogContent>
				</AlertDialog>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("title")).toBeInTheDocument();
			});

			const title = screen.getByTestId("title");
			expect(title.className).toContain("font-semibold");
			expect(title.className).toContain("text-lg");
		});
	});

	describe("AlertDialogDescription", () => {
		it("renders with muted foreground color", async () => {
			render(
				<AlertDialog defaultOpen>
					<AlertDialogContent>
						<AlertDialogDescription data-testid="description">
							Test Description
						</AlertDialogDescription>
					</AlertDialogContent>
				</AlertDialog>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("description")).toBeInTheDocument();
			});

			const description = screen.getByTestId("description");
			expect(description.className).toContain("text-muted-foreground");
			expect(description.className).toContain("text-sm");
		});
	});

	describe("AlertDialogFooter", () => {
		it("renders with responsive layout", async () => {
			render(
				<AlertDialog defaultOpen>
					<AlertDialogContent>
						<AlertDialogFooter data-testid="footer">
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction>Continue</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("footer")).toBeInTheDocument();
			});

			const footer = screen.getByTestId("footer");
			expect(footer.className).toContain("flex");
			expect(footer.className).toContain("flex-col-reverse");
			expect(footer.className).toContain("sm:flex-row");
			expect(footer.className).toContain("sm:justify-end");
		});
	});

	describe("AlertDialogAction", () => {
		it("uses button variant styles", async () => {
			render(
				<AlertDialog defaultOpen>
					<AlertDialogContent>
						<AlertDialogAction data-testid="action">
							Continue
						</AlertDialogAction>
					</AlertDialogContent>
				</AlertDialog>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("action")).toBeInTheDocument();
			});

			const action = screen.getByTestId("action");
			// Should have button-like styles
			expect(action.className).toContain("flex");
			expect(action.className).toContain("items-center");
			expect(action.className).toContain("justify-center");
		});
	});

	describe("AlertDialogCancel", () => {
		it("uses outline button variant styles", async () => {
			render(
				<AlertDialog defaultOpen>
					<AlertDialogContent>
						<AlertDialogCancel data-testid="cancel">
							Cancel
						</AlertDialogCancel>
					</AlertDialogContent>
				</AlertDialog>,
			);

			await waitFor(() => {
				expect(screen.getByTestId("cancel")).toBeInTheDocument();
			});

			const cancel = screen.getByTestId("cancel");
			// Should have outline button styles
			expect(cancel.className).toContain("border-secondary/15");
			expect(cancel.className).toContain("bg-transparent");
		});
	});

	describe("interaction", () => {
		it("opens and closes correctly", async () => {
			const onOpenChange = vi.fn();

			render(
				<AlertDialog onOpenChange={onOpenChange}>
					<AlertDialogTrigger data-testid="trigger">
						Open
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction>Continue</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>,
			);

			// Click trigger to open
			fireEvent.click(screen.getByTestId("trigger"));

			await waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(true);
			});
		});
	});
});
