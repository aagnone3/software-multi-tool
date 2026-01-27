import { createORPCClient, onError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ApiRouterClient } from "@repo/api/orpc/router";
import { getOrpcUrl } from "@repo/utils";

const link = new RPCLink({
	// URL is evaluated dynamically at request time to ensure correct
	// client-side vs server-side URL resolution in preview environments
	url: () => getOrpcUrl(),
	headers: async () => {
		if (typeof window !== "undefined") {
			// In browser context, include x-session-id for anonymous user job ownership
			const sessionId = localStorage.getItem("news-analyzer-session-id");
			if (sessionId) {
				return { "x-session-id": sessionId };
			}
			return {};
		}

		const { headers } = await import("next/headers");
		return Object.fromEntries(await headers());
	},
	interceptors: [
		onError((error) => {
			if (error instanceof Error && error.name === "AbortError") {
				return;
			}

			console.error(error);
		}),
	],
});

export const orpcClient: ApiRouterClient = createORPCClient(link);
