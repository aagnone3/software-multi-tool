import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePlanData } from "./plan-data";

describe("usePlanData", () => {
	it("returns plan data with all three plans", () => {
		const { result } = renderHook(() => usePlanData());
		const { planData } = result.current;

		expect(planData).toHaveProperty("free");
		expect(planData).toHaveProperty("starter");
		expect(planData).toHaveProperty("pro");
	});

	it("free plan has expected title and features", () => {
		const { result } = renderHook(() => usePlanData());
		const { planData } = result.current;

		expect(planData.free.title).toBe("Free");
		expect(Array.isArray(planData.free.features)).toBe(true);
		expect(planData.free.features.length).toBeGreaterThan(0);
	});

	it("starter plan has expected title and features", () => {
		const { result } = renderHook(() => usePlanData());
		const { planData } = result.current;

		expect(planData.starter.title).toBe("Starter");
		expect(Array.isArray(planData.starter.features)).toBe(true);
		expect(planData.starter.features.length).toBeGreaterThan(0);
	});

	it("pro plan has expected title and features", () => {
		const { result } = renderHook(() => usePlanData());
		const { planData } = result.current;

		expect(planData.pro.title).toBe("Pro");
		expect(Array.isArray(planData.pro.features)).toBe(true);
		expect(planData.pro.features.length).toBeGreaterThan(0);
	});

	it("all plans have description", () => {
		const { result } = renderHook(() => usePlanData());
		const { planData } = result.current;

		expect(planData.free.description).toBeTruthy();
		expect(planData.starter.description).toBeTruthy();
		expect(planData.pro.description).toBeTruthy();
	});
});
