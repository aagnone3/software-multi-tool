import type Anthropic from "@anthropic-ai/sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InMemorySkillPersistence } from "./persistence/memory";
import { SkillSession } from "./session";
import type { SkillConfig, SkillContext, SkillSessionState } from "./types";

// Mock the Anthropic SDK
vi.mock("@anthropic-ai/sdk");

const mockMessagesCreate = vi.fn();

const createMockClient = () => {
	return {
		messages: {
			create: mockMessagesCreate,
		},
	} as unknown as Anthropic;
};

describe("SkillSession", () => {
	const testConfig: SkillConfig = {
		skillId: "test-skill",
		name: "Test Skill",
		description: "A test skill for unit testing",
		systemPrompt: "You are a helpful test assistant.",
		initialMessage: "Hello! How can I help you today?",
		model: "claude-3-5-haiku-20241022",
		maxTokens: 512,
		temperature: 0.7,
		maxTurns: 5,
	};

	const testContext: SkillContext = {
		sessionId: "test-session-123",
		userId: "user-456",
		organizationId: "org-789",
		toolSlug: "test-tool",
		jobId: "job-001",
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("create", () => {
		it("should create a new session with initial message", async () => {
			const client = createMockClient();
			const session = await SkillSession.create(
				{
					config: testConfig,
					context: testContext,
				},
				client,
			);

			expect(session.getSessionId()).toBe("test-session-123");
			expect(session.getSkillId()).toBe("test-skill");
			expect(session.isComplete()).toBe(false);

			const messages = session.getMessages();
			expect(messages).toHaveLength(1);
			expect(messages[0].role).toBe("assistant");
			expect(messages[0].content).toBe(
				"Hello! How can I help you today?",
			);
		});

		it("should create a session without initial message if not configured", async () => {
			const configWithoutInitial: SkillConfig = {
				...testConfig,
				initialMessage: undefined,
			};

			const client = createMockClient();
			const session = await SkillSession.create(
				{
					config: configWithoutInitial,
					context: testContext,
				},
				client,
			);

			const messages = session.getMessages();
			expect(messages).toHaveLength(0);
		});

		it("should generate session ID if not provided", async () => {
			const contextWithoutId: SkillContext = {
				...testContext,
				sessionId: "",
			};

			const client = createMockClient();
			const session = await SkillSession.create(
				{
					config: testConfig,
					context: contextWithoutId,
				},
				client,
			);

			expect(session.getSessionId()).toMatch(/^skill_\d+_[a-z0-9]+$/);
		});

		it("should persist initial state when persistence is provided", async () => {
			const persistence = new InMemorySkillPersistence();
			const client = createMockClient();

			await SkillSession.create(
				{
					config: testConfig,
					context: testContext,
					persistence,
				},
				client,
			);

			const saved = await persistence.load("test-session-123");
			expect(saved).not.toBeNull();
			expect(saved?.id).toBe("test-session-123");
			expect(saved?.skillId).toBe("test-skill");
		});
	});

	describe("executeTurn", () => {
		it("should execute a turn and return response", async () => {
			mockMessagesCreate.mockResolvedValueOnce({
				content: [
					{
						type: "text",
						text: "I understand. How can I assist you?",
					},
				],
				model: "claude-3-5-haiku-20241022",
				usage: { input_tokens: 50, output_tokens: 20 },
				stop_reason: "end_turn",
			});

			const client = createMockClient();
			const session = await SkillSession.create(
				{
					config: testConfig,
					context: testContext,
				},
				client,
			);

			const result = await session.executeTurn(
				"I need help with something",
			);

			expect(result.response).toBe("I understand. How can I assist you?");
			expect(result.isComplete).toBe(false);
			expect(result.usage.inputTokens).toBe(50);
			expect(result.usage.outputTokens).toBe(20);

			const messages = session.getMessages();
			expect(messages).toHaveLength(3); // initial + user + assistant
			expect(messages[1].role).toBe("user");
			expect(messages[1].content).toBe("I need help with something");
			expect(messages[2].role).toBe("assistant");
		});

		it("should detect completion signal and extract data", async () => {
			mockMessagesCreate.mockResolvedValueOnce({
				content: [
					{
						type: "text",
						text: `Thank you for your feedback!

[SKILL_COMPLETE]
{
  "sentiment": "positive",
  "rating": 5,
  "summary": "User was very satisfied"
}
[/SKILL_COMPLETE]`,
					},
				],
				model: "claude-3-5-haiku-20241022",
				usage: { input_tokens: 100, output_tokens: 50 },
				stop_reason: "end_turn",
			});

			const client = createMockClient();
			const session = await SkillSession.create(
				{
					config: testConfig,
					context: testContext,
				},
				client,
			);

			const result = await session.executeTurn("Everything was great!");

			expect(result.isComplete).toBe(true);
			expect(result.extractedData).toEqual({
				sentiment: "positive",
				rating: 5,
				summary: "User was very satisfied",
			});
			expect(session.isComplete()).toBe(true);
			expect(session.getExtractedData()).toEqual(result.extractedData);
		});

		it("should throw error when session is complete", async () => {
			mockMessagesCreate.mockResolvedValueOnce({
				content: [
					{
						type: "text",
						text: `Done!

[SKILL_COMPLETE]
{"done": true}
[/SKILL_COMPLETE]`,
					},
				],
				model: "claude-3-5-haiku-20241022",
				usage: { input_tokens: 50, output_tokens: 20 },
				stop_reason: "end_turn",
			});

			const client = createMockClient();
			const session = await SkillSession.create(
				{
					config: testConfig,
					context: testContext,
				},
				client,
			);

			await session.executeTurn("First message");

			await expect(
				session.executeTurn("Another message"),
			).rejects.toThrow("Cannot execute turn on completed session");
		});

		it("should throw error when max turns reached", async () => {
			const limitedConfig: SkillConfig = {
				...testConfig,
				maxTurns: 2,
			};

			mockMessagesCreate.mockResolvedValue({
				content: [{ type: "text", text: "Response" }],
				model: "claude-3-5-haiku-20241022",
				usage: { input_tokens: 10, output_tokens: 5 },
				stop_reason: "end_turn",
			});

			const client = createMockClient();
			const session = await SkillSession.create(
				{
					config: limitedConfig,
					context: testContext,
				},
				client,
			);

			await session.executeTurn("Turn 1");
			await session.executeTurn("Turn 2");

			await expect(session.executeTurn("Turn 3")).rejects.toThrow(
				"Maximum turns (2) reached",
			);
		});

		it("should persist state after each turn", async () => {
			const persistence = new InMemorySkillPersistence();

			mockMessagesCreate.mockResolvedValue({
				content: [{ type: "text", text: "Response" }],
				model: "claude-3-5-haiku-20241022",
				usage: { input_tokens: 30, output_tokens: 10 },
				stop_reason: "end_turn",
			});

			const client = createMockClient();
			const session = await SkillSession.create(
				{
					config: testConfig,
					context: testContext,
					persistence,
				},
				client,
			);

			await session.executeTurn("Message 1");

			const saved = await persistence.load("test-session-123");
			expect(saved?.messages).toHaveLength(3);
			expect(saved?.totalUsage.inputTokens).toBe(30);
			expect(saved?.totalUsage.outputTokens).toBe(10);
		});

		it("should accumulate token usage across turns", async () => {
			mockMessagesCreate
				.mockResolvedValueOnce({
					content: [{ type: "text", text: "Response 1" }],
					model: "claude-3-5-haiku-20241022",
					usage: { input_tokens: 30, output_tokens: 10 },
					stop_reason: "end_turn",
				})
				.mockResolvedValueOnce({
					content: [{ type: "text", text: "Response 2" }],
					model: "claude-3-5-haiku-20241022",
					usage: { input_tokens: 50, output_tokens: 20 },
					stop_reason: "end_turn",
				});

			const client = createMockClient();
			const session = await SkillSession.create(
				{
					config: testConfig,
					context: testContext,
				},
				client,
			);

			await session.executeTurn("Message 1");
			await session.executeTurn("Message 2");

			const totalUsage = session.getTotalUsage();
			expect(totalUsage.inputTokens).toBe(80);
			expect(totalUsage.outputTokens).toBe(30);
		});
	});

	describe("restore", () => {
		it("should restore session from state", async () => {
			const restoredContext: SkillContext = {
				...testContext,
				sessionId: "restored-session",
			};
			const savedState: SkillSessionState = {
				id: "restored-session",
				skillId: "test-skill",
				context: restoredContext,
				messages: [
					{
						role: "assistant" as const,
						content: "Hello!",
						timestamp: new Date(),
					},
					{
						role: "user" as const,
						content: "Hi there",
						timestamp: new Date(),
					},
				],
				isComplete: false,
				totalUsage: { inputTokens: 100, outputTokens: 50 },
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const client = createMockClient();
			const session = await SkillSession.restore(
				savedState,
				testConfig,
				undefined,
				client,
			);

			expect(session.getSessionId()).toBe("restored-session");
			expect(session.getMessages()).toHaveLength(2);
			expect(session.getTotalUsage()).toEqual({
				inputTokens: 100,
				outputTokens: 50,
			});
		});

		it("should restore completed session", async () => {
			const savedState: SkillSessionState = {
				id: "completed-session",
				skillId: "test-skill",
				context: testContext,
				messages: [],
				isComplete: true,
				extractedData: { result: "done" },
				totalUsage: { inputTokens: 200, outputTokens: 100 },
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const client = createMockClient();
			const session = await SkillSession.restore(
				savedState,
				testConfig,
				undefined,
				client,
			);

			expect(session.isComplete()).toBe(true);
			expect(session.getExtractedData()).toEqual({ result: "done" });
		});
	});

	describe("markComplete", () => {
		it("should manually mark session as complete", async () => {
			const client = createMockClient();
			const session = await SkillSession.create(
				{
					config: testConfig,
					context: testContext,
				},
				client,
			);

			await session.markComplete({ manualCompletion: true });

			expect(session.isComplete()).toBe(true);
			expect(session.getExtractedData()).toEqual({
				manualCompletion: true,
			});
		});

		it("should persist when marking complete with persistence", async () => {
			const persistence = new InMemorySkillPersistence();
			const client = createMockClient();

			const session = await SkillSession.create(
				{
					config: testConfig,
					context: testContext,
					persistence,
				},
				client,
			);

			await session.markComplete({ reason: "user_cancelled" });

			const saved = await persistence.load("test-session-123");
			expect(saved?.isComplete).toBe(true);
			expect(saved?.extractedData).toEqual({ reason: "user_cancelled" });
		});
	});

	describe("getTranscript", () => {
		it("should return formatted transcript", async () => {
			mockMessagesCreate.mockResolvedValueOnce({
				content: [{ type: "text", text: "Nice to meet you!" }],
				model: "claude-3-5-haiku-20241022",
				usage: { input_tokens: 20, output_tokens: 10 },
				stop_reason: "end_turn",
			});

			const client = createMockClient();
			const session = await SkillSession.create(
				{
					config: testConfig,
					context: testContext,
				},
				client,
			);

			await session.executeTurn("Hello!");

			const transcript = session.getTranscript();

			expect(transcript).toContain(
				"[ASSISTANT]: Hello! How can I help you today?",
			);
			expect(transcript).toContain("[USER]: Hello!");
			expect(transcript).toContain("[ASSISTANT]: Nice to meet you!");
		});
	});

	describe("getState", () => {
		it("should return complete state for serialization", async () => {
			const client = createMockClient();
			const session = await SkillSession.create(
				{
					config: testConfig,
					context: testContext,
				},
				client,
			);

			const state = session.getState();

			expect(state.id).toBe("test-session-123");
			expect(state.skillId).toBe("test-skill");
			expect(state.context).toEqual(testContext);
			expect(state.messages).toHaveLength(1);
			expect(state.isComplete).toBe(false);
			expect(state.totalUsage).toEqual({
				inputTokens: 0,
				outputTokens: 0,
			});
			expect(state.createdAt).toBeInstanceOf(Date);
			expect(state.updatedAt).toBeInstanceOf(Date);
		});
	});

	describe("context handling", () => {
		it("should include tool context in system prompt", async () => {
			mockMessagesCreate.mockResolvedValueOnce({
				content: [{ type: "text", text: "Response" }],
				model: "claude-3-5-haiku-20241022",
				usage: { input_tokens: 50, output_tokens: 20 },
				stop_reason: "end_turn",
			});

			const client = createMockClient();
			const session = await SkillSession.create(
				{
					config: testConfig,
					context: testContext,
				},
				client,
			);

			await session.executeTurn("Test message");

			expect(mockMessagesCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					system: expect.stringContaining("Tool: test-tool"),
				}),
			);
			expect(mockMessagesCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					system: expect.stringContaining("Job ID: job-001"),
				}),
			);
		});

		it("should include metadata in system prompt", async () => {
			const contextWithMetadata: SkillContext = {
				...testContext,
				metadata: {
					customField: "custom value",
					anotherField: 42,
				},
			};

			mockMessagesCreate.mockResolvedValueOnce({
				content: [{ type: "text", text: "Response" }],
				model: "claude-3-5-haiku-20241022",
				usage: { input_tokens: 50, output_tokens: 20 },
				stop_reason: "end_turn",
			});

			const client = createMockClient();
			const session = await SkillSession.create(
				{
					config: testConfig,
					context: contextWithMetadata,
				},
				client,
			);

			await session.executeTurn("Test message");

			expect(mockMessagesCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					system: expect.stringContaining(
						"customField: custom value",
					),
				}),
			);
			expect(mockMessagesCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					system: expect.stringContaining("anotherField: 42"),
				}),
			);
		});
	});
});
