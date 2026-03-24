import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebounce } from "./use-debounce";

describe("useDebounce", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns the initial value immediately", () => {
		const { result } = renderHook(() => useDebounce("hello", 300));
		expect(result.current).toBe("hello");
	});

	it("does not update until delay has passed", () => {
		const { result, rerender } = renderHook(
			({ value }: { value: string }) => useDebounce(value, 300),
			{ initialProps: { value: "initial" } },
		);

		rerender({ value: "updated" });
		expect(result.current).toBe("initial");

		act(() => {
			vi.advanceTimersByTime(200);
		});
		expect(result.current).toBe("initial");

		act(() => {
			vi.advanceTimersByTime(100);
		});
		expect(result.current).toBe("updated");
	});

	it("resets the timer on rapid changes", () => {
		const { result, rerender } = renderHook(
			({ value }: { value: string }) => useDebounce(value, 300),
			{ initialProps: { value: "a" } },
		);

		rerender({ value: "b" });
		act(() => {
			vi.advanceTimersByTime(200);
		});
		rerender({ value: "c" });
		act(() => {
			vi.advanceTimersByTime(200);
		});
		// Still not past 300ms from last change
		expect(result.current).toBe("a");

		act(() => {
			vi.advanceTimersByTime(100);
		});
		expect(result.current).toBe("c");
	});

	it("uses 300ms as default delay", () => {
		const { result, rerender } = renderHook(
			({ value }: { value: number }) => useDebounce(value),
			{ initialProps: { value: 1 } },
		);
		rerender({ value: 2 });
		act(() => {
			vi.advanceTimersByTime(299);
		});
		expect(result.current).toBe(1);
		act(() => {
			vi.advanceTimersByTime(1);
		});
		expect(result.current).toBe(2);
	});
});
