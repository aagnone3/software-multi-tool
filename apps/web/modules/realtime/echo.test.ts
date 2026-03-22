import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startHeartbeat, subscribeToEcho } from "./echo";

// ============================================================================
// Mock @supabase/supabase-js
// ============================================================================

const { mockRemoveChannel, mockChannel, mockSupabaseClient } = vi.hoisted(
	() => {
		const mockRemoveChannel = vi.fn();

		const mockChannel = {
			on: vi.fn().mockReturnThis(),
			subscribe: vi.fn().mockReturnThis(),
			send: vi.fn().mockResolvedValue({ status: "ok" }),
		};

		const mockSupabaseClient = {
			channel: vi.fn().mockReturnValue(mockChannel),
			removeChannel: mockRemoveChannel,
		};

		return { mockRemoveChannel, mockChannel, mockSupabaseClient };
	},
);

vi.mock("@supabase/supabase-js", () => ({
	createClient: vi.fn().mockReturnValue(mockSupabaseClient),
}));

// ============================================================================
// Tests
// ============================================================================

describe("subscribeToEcho", () => {
	beforeEach(() => {
		vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
		vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
		mockChannel.on.mockReturnThis();
		mockChannel.subscribe.mockReturnThis();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.clearAllMocks();
	});

	it("subscribes to echo events on the given channel", () => {
		const onEcho = vi.fn();
		subscribeToEcho({ channelName: "test-channel", onEcho });

		expect(mockSupabaseClient.channel).toHaveBeenCalledWith("test-channel");
		expect(mockChannel.on).toHaveBeenCalledWith(
			"broadcast",
			{ event: "echo" },
			expect.any(Function),
		);
		expect(mockChannel.subscribe).toHaveBeenCalled();
	});

	it("calls onEcho with the broadcast payload", () => {
		const onEcho = vi.fn();
		let broadcastHandler: ((arg: { payload: unknown }) => void) | null =
			null;
		mockChannel.on.mockImplementation(
			(
				_type: string,
				_filter: unknown,
				handler: (arg: { payload: unknown }) => void,
			) => {
				broadcastHandler = handler;
				return mockChannel;
			},
		);

		subscribeToEcho({ channelName: "test-channel", onEcho });

		const fakeMessage = {
			type: "echo" as const,
			data: { hello: "world" },
			timestamp: "2026-01-01T00:00:00.000Z",
		};
		// biome-ignore lint/style/noNonNullAssertion: handler is always set before this line
		broadcastHandler!({ payload: fakeMessage });

		expect(onEcho).toHaveBeenCalledWith(fakeMessage);
	});

	it("calls onStatusChange when subscription status changes", () => {
		const onEcho = vi.fn();
		const onStatusChange = vi.fn();
		mockChannel.subscribe.mockImplementation(
			(cb: (status: string) => void) => {
				cb("SUBSCRIBED");
				return mockChannel;
			},
		);

		subscribeToEcho({ channelName: "ch", onEcho, onStatusChange });

		expect(onStatusChange).toHaveBeenCalledWith("SUBSCRIBED");
	});

	it("returns an unsubscribe function that removes the channel", () => {
		const onEcho = vi.fn();

		const { unsubscribe } = subscribeToEcho({
			channelName: "test-channel",
			onEcho,
		});

		unsubscribe();
		expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
	});
});

describe("startHeartbeat", () => {
	beforeEach(() => {
		vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
		vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
		vi.useFakeTimers();
		mockChannel.on.mockReturnThis();
		mockChannel.subscribe.mockReturnThis();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	it("returns a stop function", () => {
		const { stop } = startHeartbeat({ channelName: "hb-ch" });
		expect(typeof stop).toBe("function");
	});

	it("stop() removes the channel and clears intervals", () => {
		mockChannel.subscribe.mockImplementation(
			(cb: (status: string) => void) => {
				cb("SUBSCRIBED");
				return mockChannel;
			},
		);

		const { stop } = startHeartbeat({
			channelName: "hb-ch",
			intervalMs: 5000,
		});

		stop();
		expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
	});

	it("calls onPong when a pong broadcast is received", () => {
		const onPong = vi.fn();
		let pongHandler: ((arg: { payload: unknown }) => void) | null = null;

		mockChannel.on.mockImplementation(
			(
				_type: string,
				_filter: unknown,
				handler: (arg: { payload: unknown }) => void,
			) => {
				pongHandler = handler;
				return mockChannel;
			},
		);
		mockChannel.subscribe.mockImplementation(
			(cb: (status: string) => void) => {
				cb("SUBSCRIBED");
				return mockChannel;
			},
		);

		const { stop } = startHeartbeat({
			channelName: "hb-ch",
			onPong,
			intervalMs: 60000,
		});

		// simulate a pong broadcast
		// biome-ignore lint/style/noNonNullAssertion: handler is always set before this line
		pongHandler!({
			payload: { type: "pong", timestamp: "2026-01-01T00:00:00.000Z" },
		});

		expect(onPong).toHaveBeenCalled();
		stop();
	});

	it("calls onTimeout when pong is not received in time", () => {
		const onTimeout = vi.fn();
		mockChannel.subscribe.mockImplementation(
			(cb: (status: string) => void) => {
				cb("SUBSCRIBED");
				return mockChannel;
			},
		);

		const { stop } = startHeartbeat({
			channelName: "hb-ch",
			intervalMs: 1000,
			timeoutMs: 500,
			onTimeout,
		});

		// trigger the interval then the timeout
		vi.advanceTimersByTime(1000);
		vi.advanceTimersByTime(500);

		expect(onTimeout).toHaveBeenCalled();
		stop();
	});
});
