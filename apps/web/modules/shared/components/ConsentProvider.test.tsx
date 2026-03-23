import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Cookies from "js-cookie";
import React, { useContext } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConsentContext, ConsentProvider } from "./ConsentProvider";

vi.mock("js-cookie", () => ({
	default: { set: vi.fn(), get: vi.fn() },
}));

function TestConsumer() {
	const { userHasConsented, allowCookies, declineCookies } =
		useContext(ConsentContext);
	return (
		<div>
			<span data-testid="consent">{String(userHasConsented)}</span>
			<button type="button" onClick={allowCookies}>
				Allow
			</button>
			<button type="button" onClick={declineCookies}>
				Decline
			</button>
		</div>
	);
}

describe("ConsentProvider", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders children", () => {
		render(
			<ConsentProvider>
				<span>child</span>
			</ConsentProvider>,
		);
		expect(screen.getByText("child")).toBeTruthy();
	});

	it("initialConsent=false → userHasConsented is false by default", () => {
		render(
			<ConsentProvider>
				<TestConsumer />
			</ConsentProvider>,
		);
		expect(screen.getByTestId("consent").textContent).toBe("false");
	});

	it("initialConsent=true → userHasConsented starts true", () => {
		render(
			<ConsentProvider initialConsent={true}>
				<TestConsumer />
			</ConsentProvider>,
		);
		expect(screen.getByTestId("consent").textContent).toBe("true");
	});

	it("allowCookies sets cookie and updates state", async () => {
		const user = userEvent.setup({ delay: null });
		render(
			<ConsentProvider>
				<TestConsumer />
			</ConsentProvider>,
		);
		await user.click(screen.getByText("Allow"));
		expect(Cookies.set).toHaveBeenCalledWith("consent", "true", {
			expires: 30,
		});
		expect(screen.getByTestId("consent").textContent).toBe("true");
	});

	it("declineCookies sets cookie and keeps state false", async () => {
		const user = userEvent.setup({ delay: null });
		render(
			<ConsentProvider initialConsent={true}>
				<TestConsumer />
			</ConsentProvider>,
		);
		await user.click(screen.getByText("Decline"));
		expect(Cookies.set).toHaveBeenCalledWith("consent", "false", {
			expires: 30,
		});
		expect(screen.getByTestId("consent").textContent).toBe("false");
	});
});
