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

	it("returns initial value immediately", () => {
		const { result } = renderHook(() => useDebounce("initial", 500));
		expect(result.current).toBe("initial");
	});

	it("debounces value changes", () => {
		const { result, rerender } = renderHook(
			({ value, delay }) => useDebounce(value, delay),
			{ initialProps: { value: "initial", delay: 500 } },
		);

		expect(result.current).toBe("initial");

		// Update the value
		rerender({ value: "updated", delay: 500 });

		// Value should not change immediately
		expect(result.current).toBe("initial");

		// Advance time by less than delay
		act(() => {
			vi.advanceTimersByTime(300);
		});
		expect(result.current).toBe("initial");

		// Advance time past delay
		act(() => {
			vi.advanceTimersByTime(200);
		});
		expect(result.current).toBe("updated");
	});

	it("resets timer on rapid changes", () => {
		const { result, rerender } = renderHook(
			({ value, delay }) => useDebounce(value, delay),
			{ initialProps: { value: "a", delay: 500 } },
		);

		expect(result.current).toBe("a");

		// Rapid updates
		rerender({ value: "b", delay: 500 });
		act(() => {
			vi.advanceTimersByTime(200);
		});

		rerender({ value: "c", delay: 500 });
		act(() => {
			vi.advanceTimersByTime(200);
		});

		rerender({ value: "d", delay: 500 });
		act(() => {
			vi.advanceTimersByTime(200);
		});

		// Still should be "a" since timer keeps resetting
		expect(result.current).toBe("a");

		// Wait for full delay after last update
		act(() => {
			vi.advanceTimersByTime(500);
		});
		expect(result.current).toBe("d");
	});

	it("handles different delay values", () => {
		const { result, rerender } = renderHook(
			({ value, delay }) => useDebounce(value, delay),
			{ initialProps: { value: "test", delay: 100 } },
		);

		rerender({ value: "new value", delay: 100 });

		act(() => {
			vi.advanceTimersByTime(100);
		});

		expect(result.current).toBe("new value");
	});

	it("works with non-string values", () => {
		const { result, rerender } = renderHook(
			({ value, delay }) => useDebounce(value, delay),
			{ initialProps: { value: { count: 0 }, delay: 300 } },
		);

		expect(result.current).toEqual({ count: 0 });

		rerender({ value: { count: 1 }, delay: 300 });

		act(() => {
			vi.advanceTimersByTime(300);
		});

		expect(result.current).toEqual({ count: 1 });
	});
});
