import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { SubscriptionStatusBadge } from "./SubscriptionStatusBadge";

describe("SubscriptionStatusBadge", () => {
	it.each([
		["active", "Active"],
		["canceled", "Canceled"],
		["expired", "Expired"],
		["incomplete", "Incomplete"],
		["past_due", "Past due"],
		["paused", "Paused"],
		["trialing", "Trialing"],
		["unpaid", "Unpaid"],
	])("renders correct label for status '%s'", (status, expectedLabel) => {
		render(<SubscriptionStatusBadge status={status} />);
		expect(screen.getByText(expectedLabel)).toBeInTheDocument();
	});

	it("renders with unknown status gracefully", () => {
		render(<SubscriptionStatusBadge status="unknown" />);
		// Badge still renders, just with undefined values
		expect(document.querySelector("[class]")).toBeTruthy();
	});
});
