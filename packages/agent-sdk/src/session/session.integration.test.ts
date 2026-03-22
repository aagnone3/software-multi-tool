import { describe, expect, it } from "vitest";
import { createFeedbackCollectorConfig } from "./examples/feedback-collector";
import { InMemorySessionPersistence } from "./persistence/memory";
import { AgentSession } from "./session";
import type { AgentSessionConfig, SessionContext } from "./types";

/**
 * Integration test for Agent Session infrastructure.
 *
 * This test verifies that agent sessions can successfully conduct multi-turn
 * conversations with the Anthropic API.
 *
 * IMPORTANT: This test REQUIRES ANTHROPIC_API_KEY to be set.
 * Tests will FAIL if the key is missing (not skip).
 *
 * Environment variables are loaded from apps/web/.env.local via tests/setup/environment.ts.
 */
describe.concurrent("Agent Session Integration", () => {
	const requireApiKey = () => {
		if (!process.env.ANTHROPIC_API_KEY) {
			throw new Error(
				"ANTHROPIC_API_KEY is required for integration tests. " +
					"Set it in apps/web/.env.local. " +
					"Environment variables are loaded automatically from this file via tests/setup/environment.ts.",
			);
		}
	};

	const testContext: SessionContext = {
		sessionId: `integration-test-${Date.now()}`,
		userId: "integration-test-user",
		toolSlug: "integration-test-tool",
	};

	// Simple test session config
	const simpleSessionConfig: AgentSessionConfig = {
		sessionType: "integration-test-session",
		name: "Integration Test Session",
		description: "A minimal session for integration testing",
		systemPrompt: `You are a simple assistant for testing.
When the user says "complete", respond with exactly this format:

[SESSION_COMPLETE]
{"status": "completed", "message": "test passed"}
[/SESSION_COMPLETE]

Otherwise, just respond with a brief acknowledgment.`,
		model: "claude-haiku-4-5-20251001",
		maxTokens: 256,
		temperature: 0.3,
		maxTurns: 5,
	};

	it(
		"should execute a multi-turn conversation",
		{ timeout: 60000 },
		async () => {
			requireApiKey();

			const persistence = new InMemorySessionPersistence();
			const session = await AgentSession.create({
				config: simpleSessionConfig,
				context: testContext,
				persistence,
			});

			// First turn
			const result1 = await session.executeTurn("Hello, this is a test");

			expect(result1).toBeDefined();
			expect(result1.response).toBeDefined();
			expect(typeof result1.response).toBe("string");
			expect(result1.response.length).toBeGreaterThan(0);
			expect(result1.isComplete).toBe(false);
			expect(result1.usage.inputTokens).toBeGreaterThan(0);
			expect(result1.usage.outputTokens).toBeGreaterThan(0);

			// Verify messages were recorded
			const messages = session.getMessages();
			expect(messages.length).toBeGreaterThanOrEqual(2);

			// Verify persistence
			const savedState = await persistence.load(session.getSessionId());
			expect(savedState).not.toBeNull();
			expect(savedState?.messages.length).toBe(messages.length);

			// Keep assertions as the integration proof; avoid noisy stdout in passing runs.
		},
	);

	it(
		"should detect completion signal from Claude",
		{ timeout: 60000 },
		async () => {
			requireApiKey();

			const session = await AgentSession.create({
				config: simpleSessionConfig,
				context: {
					...testContext,
					sessionId: `completion-test-${Date.now()}`,
				},
			});

			// Trigger completion
			const result = await session.executeTurn("complete");

			expect(result.isComplete).toBe(true);
			expect(result.extractedData).toBeDefined();
			expect(result.extractedData).toHaveProperty("status");
			expect(session.isComplete()).toBe(true);

			// Keep assertions as the integration proof; avoid noisy stdout in passing runs.
		},
	);

	it(
		"should work with FeedbackCollector config",
		{ timeout: 60000 },
		async () => {
			requireApiKey();

			const feedbackConfig = createFeedbackCollectorConfig({
				toolName: "Test Tool",
				toolSlug: "test-tool",
			});

			const session = await AgentSession.create({
				config: feedbackConfig,
				context: {
					...testContext,
					sessionId: `feedback-test-${Date.now()}`,
				},
			});

			// Check initial message was set
			const initialMessages = session.getMessages();
			expect(initialMessages.length).toBe(1);
			expect(initialMessages[0].role).toBe("assistant");
			expect(initialMessages[0].content).toContain("experience");

			// Send feedback
			const result = await session.executeTurn(
				"The tool worked great! Very fast and accurate.",
			);

			expect(result.response).toBeDefined();
			expect(result.response.length).toBeGreaterThan(0);

			// The assistant should ask a follow-up question
			expect(result.isComplete).toBe(false);

			// Keep assertions as the integration proof; avoid noisy stdout in passing runs.
		},
	);

	it(
		"should persist and restore session state",
		{ timeout: 60000 },
		async () => {
			requireApiKey();

			const persistence = new InMemorySessionPersistence();
			const sessionId = `persist-test-${Date.now()}`;

			// Create and use a session
			const session1 = await AgentSession.create({
				config: simpleSessionConfig,
				context: {
					...testContext,
					sessionId,
				},
				persistence,
			});

			await session1.executeTurn("First message");
			const usage1 = session1.getTotalUsage();

			// Load the saved state
			const savedState = await persistence.load(sessionId);
			expect(savedState).not.toBeNull();

			// Restore session from state
			const session2 = await AgentSession.restore(
				savedState as NonNullable<typeof savedState>,
				simpleSessionConfig,
				persistence,
			);

			// Verify restored state
			expect(session2.getSessionId()).toBe(sessionId);
			expect(session2.getMessages().length).toBe(
				session1.getMessages().length,
			);
			expect(session2.getTotalUsage()).toEqual(usage1);

			// Continue the conversation
			const result = await session2.executeTurn("Second message");
			expect(result.response).toBeDefined();

			// Verify usage accumulated
			const finalUsage = session2.getTotalUsage();
			expect(finalUsage.inputTokens).toBeGreaterThan(usage1.inputTokens);
			expect(finalUsage.outputTokens).toBeGreaterThan(
				usage1.outputTokens,
			);

			// Keep assertions as the integration proof; avoid noisy stdout in passing runs.
		},
	);

	it("should track token usage correctly", { timeout: 60000 }, async () => {
		requireApiKey();

		const session = await AgentSession.create({
			config: simpleSessionConfig,
			context: {
				...testContext,
				sessionId: `usage-test-${Date.now()}`,
			},
		});

		const result1 = await session.executeTurn("First");
		const usage1 = session.getTotalUsage();

		expect(usage1.inputTokens).toBe(result1.usage.inputTokens);
		expect(usage1.outputTokens).toBe(result1.usage.outputTokens);

		const result2 = await session.executeTurn("Second");
		const usage2 = session.getTotalUsage();

		expect(usage2.inputTokens).toBe(
			result1.usage.inputTokens + result2.usage.inputTokens,
		);
		expect(usage2.outputTokens).toBe(
			result1.usage.outputTokens + result2.usage.outputTokens,
		);

		// Keep assertions as the integration proof; avoid noisy stdout in passing runs.
	});
});
