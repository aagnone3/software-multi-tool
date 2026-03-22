import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRealtimeBroadcast, useRealtimeEcho } from "./hooks";

// Stub required env vars so the realtime client module doesn't throw
// if the dynamic import in useRealtimeBroadcast bypasses vi.mock
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

// Mock echo module
const subscribeToEchoMock = vi.hoisted(() => vi.fn());
const sendEchoMessageMock = vi.hoisted(() => vi.fn());
const startHeartbeatMock = vi.hoisted(() => vi.fn());

vi.mock("./echo", () => ({
	subscribeToEcho: subscribeToEchoMock,
	sendEchoMessage: sendEchoMessageMock,
	startHeartbeat: startHeartbeatMock,
}));

// Mock client module for useRealtimeBroadcast
const subscribeToBroadcastMock = vi.hoisted(() => vi.fn());
const broadcastMessageMock = vi.hoisted(() => vi.fn());

vi.mock("./client", () => ({
	subscribeToBroadcast: subscribeToBroadcastMock,
	broadcastMessage: broadcastMessageMock,
}));

describe("useRealtimeEcho", () => {
	let capturedCallbacks: {
		onEcho?: (msg: unknown) => void;
		onStatusChange?: (status: string) => void;
	};
	const unsubscribeMock = vi.fn();

	beforeEach(() => {
		capturedCallbacks = {};
		unsubscribeMock.mockReset();
		subscribeToEchoMock.mockImplementation(
			(opts: {
				onEcho?: (msg: unknown) => void;
				onStatusChange?: (status: string) => void;
			}) => {
				capturedCallbacks = opts;
				return { unsubscribe: unsubscribeMock };
			},
		);
		sendEchoMessageMock.mockResolvedValue(undefined);
		startHeartbeatMock.mockReturnValue({ stop: vi.fn() });
	});

	it("starts disconnected", () => {
		const { result } = renderHook(() => useRealtimeEcho("test-channel"));
		expect(result.current.isConnected).toBe(false);
		expect(result.current.lastEcho).toBeNull();
	});

	it("sets isConnected when status is SUBSCRIBED", () => {
		const { result } = renderHook(() => useRealtimeEcho("test-channel"));
		act(() => {
			capturedCallbacks.onStatusChange?.("SUBSCRIBED");
		});
		expect(result.current.isConnected).toBe(true);
	});

	it("sets isConnected to false for non-SUBSCRIBED status", () => {
		const { result } = renderHook(() => useRealtimeEcho("test-channel"));
		act(() => {
			capturedCallbacks.onStatusChange?.("SUBSCRIBED");
		});
		act(() => {
			capturedCallbacks.onStatusChange?.("CLOSED");
		});
		expect(result.current.isConnected).toBe(false);
	});

	it("updates lastEcho on echo message", () => {
		const { result } = renderHook(() => useRealtimeEcho("test-channel"));
		const message = { data: { test: "hello" }, timestamp: Date.now() };
		act(() => {
			capturedCallbacks.onEcho?.(message);
		});
		expect(result.current.lastEcho).toBe(message);
	});

	it("sendEcho calls sendEchoMessage with correct args", async () => {
		const { result } = renderHook(() => useRealtimeEcho("my-channel"));
		await act(async () => {
			await result.current.sendEcho({ hello: "world" });
		});
		expect(sendEchoMessageMock).toHaveBeenCalledWith({
			channelName: "my-channel",
			payload: { hello: "world" },
		});
	});

	it("starts heartbeat when enableHeartbeat is true and connected", () => {
		const { result } = renderHook(() =>
			useRealtimeEcho("test-channel", { enableHeartbeat: true }),
		);
		act(() => {
			capturedCallbacks.onStatusChange?.("SUBSCRIBED");
		});
		expect(result.current.isConnected).toBe(true);
		expect(startHeartbeatMock).toHaveBeenCalledWith(
			expect.objectContaining({ channelName: "test-channel" }),
		);
	});

	it("does not start heartbeat when enableHeartbeat is false", () => {
		renderHook(() =>
			useRealtimeEcho("test-channel", { enableHeartbeat: false }),
		);
		expect(startHeartbeatMock).not.toHaveBeenCalled();
	});

	it("unsubscribes on unmount", () => {
		const { unmount } = renderHook(() => useRealtimeEcho("test-channel"));
		unmount();
		expect(unsubscribeMock).toHaveBeenCalled();
	});
});

describe("useRealtimeBroadcast", () => {
	const unsubscribeBroadcastMock = vi.fn();

	beforeEach(() => {
		unsubscribeBroadcastMock.mockReset();
		subscribeToBroadcastMock.mockReturnValue({
			unsubscribe: unsubscribeBroadcastMock,
		});
		broadcastMessageMock.mockResolvedValue(undefined);
	});

	it("starts with null lastMessage", () => {
		const { result } = renderHook(() =>
			useRealtimeBroadcast("room", "message"),
		);
		expect(result.current.lastMessage).toBeNull();
	});

	it("exposes send function", () => {
		const { result } = renderHook(() =>
			useRealtimeBroadcast("room", "message"),
		);
		expect(typeof result.current.send).toBe("function");
	});
});
