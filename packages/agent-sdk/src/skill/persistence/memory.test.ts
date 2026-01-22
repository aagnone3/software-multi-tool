import { beforeEach, describe, expect, it } from "vitest";
import type { SkillSessionState } from "../types";
import { InMemorySkillPersistence } from "./memory";

describe("InMemorySkillPersistence", () => {
	let persistence: InMemorySkillPersistence;

	const createTestState = (
		overrides: Partial<SkillSessionState> = {},
	): SkillSessionState => ({
		id: `session-${Date.now()}-${Math.random()}`,
		skillId: "test-skill",
		context: {
			sessionId: "test-session",
			userId: "user-123",
		},
		messages: [
			{ role: "assistant", content: "Hello!", timestamp: new Date() },
		],
		isComplete: false,
		totalUsage: { inputTokens: 50, outputTokens: 25 },
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	});

	beforeEach(() => {
		persistence = new InMemorySkillPersistence();
	});

	describe("save and load", () => {
		it("should save and load a session", async () => {
			const state = createTestState({ id: "save-load-test" });

			await persistence.save(state);
			const loaded = await persistence.load("save-load-test");

			expect(loaded).not.toBeNull();
			expect(loaded?.id).toBe("save-load-test");
			expect(loaded?.skillId).toBe("test-skill");
		});

		it("should return null for non-existent session", async () => {
			const loaded = await persistence.load("non-existent");
			expect(loaded).toBeNull();
		});

		it("should deep clone state on save to prevent mutation", async () => {
			const state = createTestState({ id: "clone-test" });
			await persistence.save(state);

			// Modify original state
			state.messages.push({
				role: "user",
				content: "Modified!",
				timestamp: new Date(),
			});

			// Loaded state should not be affected
			const loaded = await persistence.load("clone-test");
			expect(loaded?.messages).toHaveLength(1);
		});

		it("should deep clone state on load to prevent mutation", async () => {
			const state = createTestState({ id: "load-clone-test" });
			await persistence.save(state);

			const loaded1 = await persistence.load("load-clone-test");
			loaded1?.messages.push({
				role: "user",
				content: "Modified!",
				timestamp: new Date(),
			});

			const loaded2 = await persistence.load("load-clone-test");
			expect(loaded2?.messages).toHaveLength(1);
		});

		it("should restore Date objects on load", async () => {
			const now = new Date();
			const state = createTestState({
				id: "date-test",
				createdAt: now,
				updatedAt: now,
				messages: [
					{ role: "assistant", content: "Test", timestamp: now },
				],
			});

			await persistence.save(state);
			const loaded = await persistence.load("date-test");

			expect(loaded?.createdAt).toBeInstanceOf(Date);
			expect(loaded?.updatedAt).toBeInstanceOf(Date);
			expect(loaded?.messages[0].timestamp).toBeInstanceOf(Date);
		});

		it("should update existing session on re-save", async () => {
			const state = createTestState({ id: "update-test" });
			await persistence.save(state);

			state.isComplete = true;
			state.extractedData = { result: "done" };
			await persistence.save(state);

			const loaded = await persistence.load("update-test");
			expect(loaded?.isComplete).toBe(true);
			expect(loaded?.extractedData).toEqual({ result: "done" });
		});
	});

	describe("delete", () => {
		it("should delete a session", async () => {
			const state = createTestState({ id: "delete-test" });
			await persistence.save(state);

			await persistence.delete("delete-test");

			const loaded = await persistence.load("delete-test");
			expect(loaded).toBeNull();
		});

		it("should not throw when deleting non-existent session", async () => {
			await expect(
				persistence.delete("non-existent"),
			).resolves.not.toThrow();
		});
	});

	describe("listByUser", () => {
		it("should list sessions for a user", async () => {
			await persistence.save(
				createTestState({
					id: "user1-session1",
					context: { sessionId: "s1", userId: "user-1" },
				}),
			);
			await persistence.save(
				createTestState({
					id: "user1-session2",
					context: { sessionId: "s2", userId: "user-1" },
				}),
			);
			await persistence.save(
				createTestState({
					id: "user2-session1",
					context: { sessionId: "s3", userId: "user-2" },
				}),
			);

			const user1Sessions = await persistence.listByUser("user-1");
			const user2Sessions = await persistence.listByUser("user-2");

			expect(user1Sessions).toHaveLength(2);
			expect(user2Sessions).toHaveLength(1);
		});

		it("should return empty array for user with no sessions", async () => {
			const sessions = await persistence.listByUser("no-sessions-user");
			expect(sessions).toEqual([]);
		});

		it("should respect limit and offset", async () => {
			for (let i = 0; i < 5; i++) {
				const state = createTestState({
					id: `paginated-${i}`,
					context: { sessionId: `s${i}`, userId: "paginated-user" },
				});
				// Set updatedAt to ensure consistent ordering
				state.updatedAt = new Date(Date.now() - i * 1000);
				await persistence.save(state);
			}

			const page1 = await persistence.listByUser("paginated-user", {
				limit: 2,
				offset: 0,
			});
			const page2 = await persistence.listByUser("paginated-user", {
				limit: 2,
				offset: 2,
			});

			expect(page1).toHaveLength(2);
			expect(page2).toHaveLength(2);
			expect(page1[0].id).not.toBe(page2[0].id);
		});

		it("should order by updatedAt descending", async () => {
			const older = createTestState({
				id: "older",
				context: { sessionId: "s1", userId: "order-user" },
			});
			older.updatedAt = new Date(Date.now() - 10000);

			const newer = createTestState({
				id: "newer",
				context: { sessionId: "s2", userId: "order-user" },
			});
			newer.updatedAt = new Date();

			await persistence.save(older);
			await persistence.save(newer);

			const sessions = await persistence.listByUser("order-user");
			expect(sessions[0].id).toBe("newer");
			expect(sessions[1].id).toBe("older");
		});
	});

	describe("listBySkill", () => {
		it("should list sessions for a skill", async () => {
			await persistence.save(
				createTestState({
					id: "skill1-session1",
					skillId: "skill-a",
				}),
			);
			await persistence.save(
				createTestState({
					id: "skill1-session2",
					skillId: "skill-a",
				}),
			);
			await persistence.save(
				createTestState({
					id: "skill2-session1",
					skillId: "skill-b",
				}),
			);

			const skillASessions = await persistence.listBySkill("skill-a");
			const skillBSessions = await persistence.listBySkill("skill-b");

			expect(skillASessions).toHaveLength(2);
			expect(skillBSessions).toHaveLength(1);
		});

		it("should respect limit and offset", async () => {
			for (let i = 0; i < 5; i++) {
				const state = createTestState({
					id: `skill-paginated-${i}`,
					skillId: "paginated-skill",
				});
				state.updatedAt = new Date(Date.now() - i * 1000);
				await persistence.save(state);
			}

			const page1 = await persistence.listBySkill("paginated-skill", {
				limit: 2,
				offset: 0,
			});
			const page2 = await persistence.listBySkill("paginated-skill", {
				limit: 2,
				offset: 2,
			});

			expect(page1).toHaveLength(2);
			expect(page2).toHaveLength(2);
		});
	});

	describe("utility methods", () => {
		it("should clear all sessions", async () => {
			await persistence.save(createTestState({ id: "clear-1" }));
			await persistence.save(createTestState({ id: "clear-2" }));

			expect(persistence.count()).toBe(2);

			persistence.clear();

			expect(persistence.count()).toBe(0);
		});

		it("should return correct count", async () => {
			expect(persistence.count()).toBe(0);

			await persistence.save(createTestState({ id: "count-1" }));
			expect(persistence.count()).toBe(1);

			await persistence.save(createTestState({ id: "count-2" }));
			expect(persistence.count()).toBe(2);

			await persistence.delete("count-1");
			expect(persistence.count()).toBe(1);
		});
	});
});
