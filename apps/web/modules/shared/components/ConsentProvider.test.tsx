import { act, render, screen } from "@testing-library/react";
import React, { useContext } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConsentContext, ConsentProvider } from "./ConsentProvider";

vi.mock("js-cookie", () => ({
	default: {
		set: vi.fn(),
		get: vi.fn(),
	},
}));

import Cookies from "js-cookie";

function TestConsumer() {
	const { userHasConsented, allowCookies, declineCookies } =
		useContext(ConsentContext);
	return (
		<div>
			<span data-testid="consent">{String(userHasConsented)}</span>
			<button onClick={allowCookies} type="button">
				allow
			</button>
			<button onClick={declineCookies} type="button">
				decline
			</button>
		</div>
	);
}

describe("ConsentProvider", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("starts with initialConsent=false by default", () => {
		render(
			<ConsentProvider>
				<TestConsumer />
			</ConsentProvider>,
		);
		expect(screen.getByTestId("consent").textContent).toBe("false");
	});

	it("starts with initialConsent=true when provided", () => {
		render(
			<ConsentProvider initialConsent={true}>
				<TestConsumer />
			</ConsentProvider>,
		);
		expect(screen.getByTestId("consent").textContent).toBe("true");
	});

	it("allowCookies sets cookie and updates consent state", () => {
		render(
			<ConsentProvider>
				<TestConsumer />
			</ConsentProvider>,
		);
		act(() => {
			screen.getByText("allow").click();
		});
		expect(Cookies.set).toHaveBeenCalledWith("consent", "true", {
			expires: 30,
		});
		expect(screen.getByTestId("consent").textContent).toBe("true");
	});

	it("declineCookies sets cookie and updates consent state", () => {
		render(
			<ConsentProvider initialConsent={true}>
				<TestConsumer />
			</ConsentProvider>,
		);
		act(() => {
			screen.getByText("decline").click();
		});
		expect(Cookies.set).toHaveBeenCalledWith("consent", "false", {
			expires: 30,
		});
		expect(screen.getByTestId("consent").textContent).toBe("false");
	});

	it("renders children", () => {
		render(
			<ConsentProvider>
				<span>child content</span>
			</ConsentProvider>,
		);
		expect(screen.getByText("child content")).toBeTruthy();
	});
});
