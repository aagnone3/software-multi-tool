import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRemoveChannel = vi.fn();
const mockRemoveAllChannels = vi.fn();
const mockGetChannels = vi.fn((): any[] => []);
const mockTrack = vi.fn().mockResolvedValue(undefined);
const mockUntrack = vi.fn().mockResolvedValue(undefined);
const mockSubscribe = vi.fn();
const mockPresenceState = vi.fn(() => ({}));
const mockSend = vi.fn().mockResolvedValue(undefined);

const makeChannel = (topic?: string) => {
	const channel: Record<string, unknown> = {
		topic: topic ?? "realtime:test-channel",
		on: vi.fn().mockReturnThis(),
		subscribe: mockSubscribe.mockReturnThis(),
		presenceState: mockPresenceState,
		send: mockSend,
		track: mockTrack,
		untrack: mockUntrack,
	};
	return channel;
};

const mockChannel = makeChannel();

const mockCreateClient = vi.fn(() => ({
	channel: vi.fn(() => mockChannel),
	removeChannel: mockRemoveChannel,
	removeAllChannels: mockRemoveAllChannels,
	getChannels: mockGetChannels,
}));

vi.mock("@supabase/supabase-js", () => ({
	createClient: (_url: unknown, _key: unknown, _opts?: unknown) =>
		mockCreateClient(),
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("realtime client", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
		vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
		// Reset the module singleton between tests
		vi.resetModules();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	describe("subscribeToBroadcast", () => {
		it("subscribes to broadcast messages and returns unsubscribe function", async () => {
			const { subscribeToBroadcast } = await import("./client");
			const onMessage = vi.fn();

			const { unsubscribe } = subscribeToBroadcast({
				channelName: "test-channel",
				event: "new-message",
				onMessage,
			});

			expect(mockChannel.on).toHaveBeenCalledWith(
				"broadcast",
				{ event: "new-message" },
				expect.any(Function),
			);
			expect(mockChannel.subscribe).toHaveBeenCalled();
			expect(typeof unsubscribe).toBe("function");
		});

		it("calls onMessage when broadcast event fires", async () => {
			const { subscribeToBroadcast } = await import("./client");
			const onMessage = vi.fn();
			const channelOnMock = mockChannel.on as ReturnType<typeof vi.fn>;

			subscribeToBroadcast({
				channelName: "test-channel",
				event: "update",
				onMessage,
			});

			// Find and call the callback registered for the broadcast event
			const broadcastCall = channelOnMock.mock.calls.find(
				(c: unknown[]) => c[0] === "broadcast",
			);
			expect(broadcastCall).toBeDefined();
			const callback = broadcastCall?.[2] as (arg: {
				payload: unknown;
			}) => void;
			callback({ payload: { text: "hello" } });

			expect(onMessage).toHaveBeenCalledWith({ text: "hello" });
		});

		it("calls removeChannel when unsubscribe is called", async () => {
			const { subscribeToBroadcast } = await import("./client");
			const { unsubscribe } = subscribeToBroadcast({
				channelName: "test-channel",
				event: "msg",
				onMessage: vi.fn(),
			});

			unsubscribe();

			expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
		});
	});

	describe("subscribeToPresence", () => {
		it("registers sync handler when onSync is provided", async () => {
			const { subscribeToPresence } = await import("./client");
			const onSync = vi.fn();
			const channelOnMock = mockChannel.on as ReturnType<typeof vi.fn>;

			subscribeToPresence({
				channelName: "presence-channel",
				presenceKey: "user-1",
				onSync,
			});

			const syncCall = channelOnMock.mock.calls.find(
				(c: unknown[]) =>
					c[0] === "presence" &&
					(c[1] as { event: string }).event === "sync",
			);
			expect(syncCall).toBeDefined();
		});

		it("returns track, untrack, and unsubscribe functions", async () => {
			const { subscribeToPresence } = await import("./client");

			const result = subscribeToPresence({
				channelName: "presence-channel",
				presenceKey: "user-1",
			});

			expect(typeof result.track).toBe("function");
			expect(typeof result.untrack).toBe("function");
			expect(typeof result.unsubscribe).toBe("function");
		});

		it("calls channel.track when track is called", async () => {
			const { subscribeToPresence } = await import("./client");

			const { track } = subscribeToPresence({
				channelName: "presence-channel",
				presenceKey: "user-1",
			});

			await track({ status: "active" });
			expect(mockTrack).toHaveBeenCalledWith({ status: "active" });
		});

		it("calls channel.untrack when untrack is called", async () => {
			const { subscribeToPresence } = await import("./client");

			const { untrack } = subscribeToPresence({
				channelName: "presence-channel",
				presenceKey: "user-1",
			});

			await untrack();
			expect(mockUntrack).toHaveBeenCalled();
		});
	});

	describe("removeAllChannels", () => {
		it("calls client.removeAllChannels", async () => {
			const { removeAllChannels } = await import("./client");
			removeAllChannels();
			expect(mockRemoveAllChannels).toHaveBeenCalled();
		});
	});

	describe("getPresenceState", () => {
		it("returns presence state for a channel", async () => {
			mockPresenceState.mockReturnValue({
				"user-1": [{ status: "active" }],
			});
			const { getPresenceState } = await import("./client");
			const state = getPresenceState("my-channel");
			expect(state).toEqual({ "user-1": [{ status: "active" }] });
		});
	});

	describe("removeChannel", () => {
		it("removes channel if found in client channels", async () => {
			const fakeChannel = { topic: "realtime:my-channel" };
			mockGetChannels.mockReturnValue([fakeChannel]);
			const { removeChannel } = await import("./client");
			removeChannel("my-channel");
			expect(mockRemoveChannel).toHaveBeenCalledWith(fakeChannel);
		});

		it("does nothing if channel not found", async () => {
			mockGetChannels.mockReturnValue([]);
			const { removeChannel } = await import("./client");
			removeChannel("nonexistent");
			expect(mockRemoveChannel).not.toHaveBeenCalled();
		});
	});
});
