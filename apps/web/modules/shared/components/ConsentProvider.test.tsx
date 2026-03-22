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
			<span data-testid="consented">{String(userHasConsented)}</span>
			<button type="button" onClick={allowCookies}>
				allow
			</button>
			<button type="button" onClick={declineCookies}>
				decline
			</button>
		</div>
	);
}

describe("ConsentProvider", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("defaults to not consented", () => {
		render(
			<ConsentProvider>
				<TestConsumer />
			</ConsentProvider>,
		);
		expect(screen.getByTestId("consented")).toHaveTextContent("false");
	});

	it("initializes with initialConsent=true", () => {
		render(
			<ConsentProvider initialConsent={true}>
				<TestConsumer />
			</ConsentProvider>,
		);
		expect(screen.getByTestId("consented")).toHaveTextContent("true");
	});

	it("allowCookies sets cookie and updates state", async () => {
		render(
			<ConsentProvider>
				<TestConsumer />
			</ConsentProvider>,
		);
		await act(async () => {
			screen.getByText("allow").click();
		});
		expect(Cookies.set).toHaveBeenCalledWith("consent", "true", {
			expires: 30,
		});
		expect(screen.getByTestId("consented")).toHaveTextContent("true");
	});

	it("declineCookies sets cookie and updates state to false", async () => {
		render(
			<ConsentProvider initialConsent={true}>
				<TestConsumer />
			</ConsentProvider>,
		);
		await act(async () => {
			screen.getByText("decline").click();
		});
		expect(Cookies.set).toHaveBeenCalledWith("consent", "false", {
			expires: 30,
		});
		expect(screen.getByTestId("consented")).toHaveTextContent("false");
	});
});
