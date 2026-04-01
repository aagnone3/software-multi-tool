import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { ApiClientProvider } from "./ApiClientProvider";

describe("ApiClientProvider", () => {
	it("renders children", () => {
		render(
			<ApiClientProvider>
				<span data-testid="child">hello</span>
			</ApiClientProvider>,
		);
		expect(screen.getByTestId("child")).toBeTruthy();
	});

	it("renders multiple children", () => {
		render(
			<ApiClientProvider>
				<span data-testid="a">a</span>
				<span data-testid="b">b</span>
			</ApiClientProvider>,
		);
		expect(screen.getByTestId("a")).toBeTruthy();
		expect(screen.getByTestId("b")).toBeTruthy();
	});
});
