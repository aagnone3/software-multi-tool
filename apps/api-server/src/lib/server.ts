import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { openApiHandler, rpcHandler } from "@repo/api/orpc/handler";
import type { FastifyInstance } from "fastify";
import Fastify from "fastify";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

export async function createServer(): Promise<FastifyInstance> {
	const server = Fastify({
		logger: {
			level: env.LOG_LEVEL,
		},
		requestIdLogLabel: "reqId",
		disableRequestLogging: false,
		trustProxy: true,
	});

	// Register CORS plugin
	await server.register(cors, {
		origin: env.CORS_ORIGIN,
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		exposedHeaders: ["Content-Length"],
		maxAge: 600,
	});

	// Register WebSocket plugin
	await server.register(websocket, {
		options: {
			maxPayload: 1048576, // 1MB
			clientTracking: true,
		},
	});

	// Health check endpoint
	server.get("/health", async (_request, reply) => {
		return reply.code(200).send("OK");
	});

	// WebSocket endpoint
	server.register(async (fastify) => {
		fastify.get("/ws", { websocket: true }, (connection, request) => {
			logger.info("WebSocket connection established", {
				ip: request.ip,
			});

			// Send welcome message
			connection.send(
				JSON.stringify({
					type: "connected",
					message: "Welcome to API Server WebSocket",
					timestamp: new Date().toISOString(),
				}),
			);

			// Handle incoming messages
			connection.on("message", (messageBuffer: Buffer) => {
				try {
					const message = JSON.parse(messageBuffer.toString());
					logger.debug("WebSocket message received", { message });

					// Echo back for now (implement actual handlers later)
					connection.send(
						JSON.stringify({
							type: "echo",
							data: message,
							timestamp: new Date().toISOString(),
						}),
					);
				} catch (error) {
					logger.error("WebSocket message parsing error", { error });
					connection.send(
						JSON.stringify({
							type: "error",
							message: "Invalid message format",
						}),
					);
				}
			});

			// Heartbeat/ping-pong
			const heartbeatInterval = setInterval(() => {
				if (connection.readyState === connection.OPEN) {
					connection.ping();
				}
			}, 30000); // 30 seconds

			connection.on("pong", () => {
				logger.debug("WebSocket pong received");
			});

			// Handle disconnection
			connection.on("close", () => {
				clearInterval(heartbeatInterval);
				logger.info("WebSocket connection closed");
			});

			// Handle errors
			connection.on("error", (error: Error) => {
				clearInterval(heartbeatInterval);
				logger.error("WebSocket error", { error });
			});
		});
	});

	// oRPC RPC Handler (binary format)
	server.all("/api/rpc/*", async (request, reply) => {
		try {
			// Convert Fastify request to Web Request
			const url = `${request.protocol}://${request.hostname}${request.url}`;
			const webRequest = new Request(url, {
				method: request.method,
				headers: request.headers as HeadersInit,
				body:
					request.method !== "GET" && request.method !== "HEAD"
						? JSON.stringify(request.body)
						: undefined,
			});

			const context = {
				headers: new Headers(request.headers as HeadersInit),
			};

			const { matched, response } = await rpcHandler.handle(webRequest, {
				prefix: "/api/rpc",
				context,
			});

			if (matched) {
				// Convert Web Response to Fastify response
				reply.code(response.status);

				// Copy headers
				for (const [key, value] of response.headers.entries()) {
					reply.header(key, value);
				}

				const body = await response.text();
				return reply.send(body);
			}

			return reply.code(404).send({ error: "Not found" });
		} catch (error) {
			logger.error("RPC handler error", { error });
			return reply.code(500).send({ error: "Internal server error" });
		}
	});

	// oRPC OpenAPI Handler (REST-style)
	server.all("/api/*", async (request, reply) => {
		try {
			// Skip /api/rpc/* (already handled above)
			if (request.url.startsWith("/api/rpc/")) {
				return reply.code(404).send({ error: "Not found" });
			}

			// Convert Fastify request to Web Request
			const url = `${request.protocol}://${request.hostname}${request.url}`;
			const webRequest = new Request(url, {
				method: request.method,
				headers: request.headers as HeadersInit,
				body:
					request.method !== "GET" && request.method !== "HEAD"
						? JSON.stringify(request.body)
						: undefined,
			});

			const context = {
				headers: new Headers(request.headers as HeadersInit),
			};

			const { matched, response } = await openApiHandler.handle(
				webRequest,
				{
					prefix: "/api",
					context,
				},
			);

			if (matched) {
				// Convert Web Response to Fastify response
				reply.code(response.status);

				// Copy headers
				for (const [key, value] of response.headers.entries()) {
					reply.header(key, value);
				}

				const body = await response.text();
				return reply.send(body);
			}

			return reply.code(404).send({ error: "Not found" });
		} catch (error) {
			logger.error("OpenAPI handler error", { error });
			return reply.code(500).send({ error: "Internal server error" });
		}
	});

	return server;
}
