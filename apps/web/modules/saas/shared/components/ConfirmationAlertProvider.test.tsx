import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import {
	ConfirmationAlertProvider,
	useConfirmationAlert,
} from "./ConfirmationAlertProvider";

function TestConsumer({
	onConfirmResult,
}: {
	onConfirmResult?: (called: boolean) => void;
}) {
	const { confirm } = useConfirmationAlert();
	return (
		<button
			type="button"
			onClick={() => {
				confirm({
					title: "Delete this?",
					message: "This action cannot be undone",
					confirmLabel: "Delete",
					cancelLabel: "Cancel",
					destructive: true,
					onConfirm: async () => {
						onConfirmResult?.(true);
					},
				});
			}}
		>
			Open dialog
		</button>
	);
}

describe("ConfirmationAlertProvider", () => {
	it("renders children", () => {
		render(
			<ConfirmationAlertProvider>
				<div>child</div>
			</ConfirmationAlertProvider>,
		);
		expect(screen.getByText("child")).toBeInTheDocument();
	});

	it("opens dialog when confirm is called", () => {
		render(
			<ConfirmationAlertProvider>
				<TestConsumer />
			</ConfirmationAlertProvider>,
		);
		fireEvent.click(screen.getByText("Open dialog"));
		expect(screen.getByText("Delete this?")).toBeInTheDocument();
		expect(
			screen.getByText("This action cannot be undone"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Delete" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Cancel" }),
		).toBeInTheDocument();
	});

	it("calls onConfirm when confirm button is clicked", async () => {
		const onConfirmResult = vi.fn();
		render(
			<ConfirmationAlertProvider>
				<TestConsumer onConfirmResult={onConfirmResult} />
			</ConfirmationAlertProvider>,
		);
		fireEvent.click(screen.getByText("Open dialog"));
		fireEvent.click(screen.getByRole("button", { name: "Delete" }));
		await waitFor(() => {
			expect(onConfirmResult).toHaveBeenCalledWith(true);
		});
	});

	it("uses default labels when not provided", () => {
		function DefaultLabelConsumer() {
			const { confirm } = useConfirmationAlert();
			return (
				<button
					type="button"
					onClick={() => {
						confirm({ title: "Sure?", onConfirm: vi.fn() });
					}}
				>
					trigger
				</button>
			);
		}
		render(
			<ConfirmationAlertProvider>
				<DefaultLabelConsumer />
			</ConfirmationAlertProvider>,
		);
		fireEvent.click(screen.getByText("trigger"));
		expect(
			screen.getByRole("button", { name: "Confirm" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Cancel" }),
		).toBeInTheDocument();
	});
});

describe("useConfirmationAlert", () => {
	it("returns confirm function", () => {
		let confirmFn: unknown;
		function Inspector() {
			const ctx = useConfirmationAlert();
			confirmFn = ctx.confirm;
			return null;
		}
		render(
			<ConfirmationAlertProvider>
				<Inspector />
			</ConfirmationAlertProvider>,
		);
		expect(typeof confirmFn).toBe("function");
	});
});
