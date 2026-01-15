import { describe, expect, it } from "vitest";
import {
	buildTargetUrl,
	HOP_BY_HOP_HEADERS,
	isStreamingResponse,
	prepareForwardHeaders,
	prepareResponseHeaders,
	RESPONSE_HEADERS_TO_STRIP,
} from "./lib";

const mockApiServerUrl = "https://api-preview.onrender.com";

describe("API Proxy lib", () => {
	describe("buildTargetUrl", () => {
		it("constructs URL with simple path", () => {
			const path = ["health"];
			const searchParams = new URLSearchParams();

			const result = buildTargetUrl(mockApiServerUrl, path, searchParams);

			expect(result.toString()).toBe(`${mockApiServerUrl}/api/health`);
		});

		it("constructs URL with nested path", () => {
			const path = ["rpc", "users", "getProfile"];
			const searchParams = new URLSearchParams();

			const result = buildTargetUrl(mockApiServerUrl, path, searchParams);

			expect(result.toString()).toBe(
				`${mockApiServerUrl}/api/rpc/users/getProfile`,
			);
		});

		it("forwards query parameters", () => {
			const path = ["search"];
			const searchParams = new URLSearchParams();
			searchParams.set("q", "test query");
			searchParams.set("page", "1");

			const result = buildTargetUrl(mockApiServerUrl, path, searchParams);

			expect(result.searchParams.get("q")).toBe("test query");
			expect(result.searchParams.get("page")).toBe("1");
		});

		it("handles empty path array", () => {
			const path: string[] = [];
			const searchParams = new URLSearchParams();

			const result = buildTargetUrl(mockApiServerUrl, path, searchParams);

			expect(result.toString()).toBe(`${mockApiServerUrl}/api/`);
		});

		it("handles special characters in path", () => {
			const path = ["users", "user@example.com"];
			const searchParams = new URLSearchParams();

			const result = buildTargetUrl(mockApiServerUrl, path, searchParams);

			// URL encodes special characters
			expect(result.pathname).toBe("/api/users/user@example.com");
		});

		it("handles special characters in query params", () => {
			const path = ["search"];
			const searchParams = new URLSearchParams();
			searchParams.set("filter", "name=John&age>30");

			const result = buildTargetUrl(mockApiServerUrl, path, searchParams);

			expect(result.searchParams.get("filter")).toBe("name=John&age>30");
		});

		it("constructs URL with localhost fallback", () => {
			const path = ["health"];
			const searchParams = new URLSearchParams();

			const result = buildTargetUrl(
				"http://localhost:3501",
				path,
				searchParams,
			);

			expect(result.toString()).toBe("http://localhost:3501/api/health");
		});
	});

	describe("prepareForwardHeaders", () => {
		it("forwards regular headers", () => {
			const headers = new Headers();
			headers.set("content-type", "application/json");
			headers.set("authorization", "Bearer token123");
			headers.set("cookie", "session=abc123");

			const result = prepareForwardHeaders(headers);

			expect(result).toHaveProperty("content-type", "application/json");
			expect(result).toHaveProperty("authorization", "Bearer token123");
			expect(result).toHaveProperty("cookie", "session=abc123");
		});

		it("filters out hop-by-hop headers", () => {
			const headers = new Headers();
			headers.set("content-type", "application/json");
			headers.set("connection", "keep-alive");
			headers.set("transfer-encoding", "chunked");
			headers.set("host", "localhost:3500");

			const result = prepareForwardHeaders(headers);

			expect(result).toHaveProperty("content-type", "application/json");
			expect(result).not.toHaveProperty("connection");
			expect(result).not.toHaveProperty("transfer-encoding");
			expect(result).not.toHaveProperty("host");
		});

		it("adds x-forwarded headers", () => {
			const headers = new Headers();
			headers.set("host", "preview.vercel.app");

			const result = prepareForwardHeaders(headers);

			expect(result).toHaveProperty(
				"x-forwarded-host",
				"preview.vercel.app",
			);
			expect(result).toHaveProperty("x-forwarded-proto", "https");
		});

		it("handles missing host header", () => {
			const headers = new Headers();

			const result = prepareForwardHeaders(headers);

			expect(result).toHaveProperty("x-forwarded-host", "");
			expect(result).toHaveProperty("x-forwarded-proto", "https");
		});
	});

	describe("prepareResponseHeaders", () => {
		it("forwards regular response headers", () => {
			const headers = new Headers();
			headers.set("content-type", "application/json");
			headers.set("set-cookie", "session=abc123; HttpOnly");
			headers.set("x-request-id", "req-123");

			const result = prepareResponseHeaders(headers);

			expect(result.get("content-type")).toBe("application/json");
			expect(result.get("set-cookie")).toBe("session=abc123; HttpOnly");
			expect(result.get("x-request-id")).toBe("req-123");
		});

		it("filters out hop-by-hop headers from response", () => {
			const headers = new Headers();
			headers.set("content-type", "application/json");
			headers.set("connection", "keep-alive");
			headers.set("transfer-encoding", "chunked");

			const result = prepareResponseHeaders(headers);

			expect(result.get("content-type")).toBe("application/json");
			expect(result.get("connection")).toBeNull();
			expect(result.get("transfer-encoding")).toBeNull();
		});

		it("strips content-encoding to prevent ERR_CONTENT_DECODING_FAILED", () => {
			// When fetch() auto-decompresses a gzipped response, the body is
			// decompressed but the Content-Encoding header remains. Forwarding
			// this header causes browsers to try to decompress already-decompressed content.
			const headers = new Headers();
			headers.set("content-type", "application/json");
			headers.set("content-encoding", "gzip");
			headers.set("content-length", "1234");

			const result = prepareResponseHeaders(headers);

			expect(result.get("content-type")).toBe("application/json");
			expect(result.get("content-encoding")).toBeNull();
			expect(result.get("content-length")).toBeNull();
		});
	});

	describe("isStreamingResponse", () => {
		it("returns true for text/event-stream content type", () => {
			const headers = new Headers();
			headers.set("content-type", "text/event-stream");

			expect(isStreamingResponse(headers)).toBe(true);
		});

		it("returns true for text/event-stream with charset", () => {
			const headers = new Headers();
			headers.set("content-type", "text/event-stream; charset=utf-8");

			expect(isStreamingResponse(headers)).toBe(true);
		});

		it("returns false for application/json", () => {
			const headers = new Headers();
			headers.set("content-type", "application/json");

			expect(isStreamingResponse(headers)).toBe(false);
		});

		it("returns false when no content-type header", () => {
			const headers = new Headers();

			expect(isStreamingResponse(headers)).toBe(false);
		});
	});

	describe("HOP_BY_HOP_HEADERS", () => {
		it("contains expected hop-by-hop headers", () => {
			expect(HOP_BY_HOP_HEADERS.has("connection")).toBe(true);
			expect(HOP_BY_HOP_HEADERS.has("keep-alive")).toBe(true);
			expect(HOP_BY_HOP_HEADERS.has("proxy-authenticate")).toBe(true);
			expect(HOP_BY_HOP_HEADERS.has("proxy-authorization")).toBe(true);
			expect(HOP_BY_HOP_HEADERS.has("te")).toBe(true);
			expect(HOP_BY_HOP_HEADERS.has("trailers")).toBe(true);
			expect(HOP_BY_HOP_HEADERS.has("transfer-encoding")).toBe(true);
			expect(HOP_BY_HOP_HEADERS.has("upgrade")).toBe(true);
			expect(HOP_BY_HOP_HEADERS.has("host")).toBe(true);
		});

		it("contains content-encoding to prevent ERR_CONTENT_DECODING_FAILED", () => {
			// fetch() auto-decompresses responses but leaves the Content-Encoding header.
			// Forwarding this header causes browsers to try to decompress already-decompressed content.
			expect(HOP_BY_HOP_HEADERS.has("content-encoding")).toBe(true);
			expect(HOP_BY_HOP_HEADERS.has("content-length")).toBe(true);
		});

		it("does not contain regular headers", () => {
			expect(HOP_BY_HOP_HEADERS.has("content-type")).toBe(false);
			expect(HOP_BY_HOP_HEADERS.has("authorization")).toBe(false);
			expect(HOP_BY_HOP_HEADERS.has("cookie")).toBe(false);
		});
	});

	describe("RESPONSE_HEADERS_TO_STRIP", () => {
		it("contains all hop-by-hop headers", () => {
			for (const header of HOP_BY_HOP_HEADERS) {
				expect(RESPONSE_HEADERS_TO_STRIP.has(header)).toBe(true);
			}
		});

		it("contains content-encoding and content-length", () => {
			expect(RESPONSE_HEADERS_TO_STRIP.has("content-encoding")).toBe(true);
			expect(RESPONSE_HEADERS_TO_STRIP.has("content-length")).toBe(true);
		});

		it("does not contain regular response headers", () => {
			expect(RESPONSE_HEADERS_TO_STRIP.has("content-type")).toBe(false);
			expect(RESPONSE_HEADERS_TO_STRIP.has("set-cookie")).toBe(false);
			expect(RESPONSE_HEADERS_TO_STRIP.has("cache-control")).toBe(false);
		});
	});
});
