import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	userFindMany: vi.fn(),
	userFindFirst: vi.fn(),
	userCount: vi.fn(),
	userInsert: vi.fn(),
	userUpdate: vi.fn(),
	accountFindFirst: vi.fn(),
	accountInsert: vi.fn(),
}));

vi.mock("../client", () => ({
	db: {
		query: {
			user: {
				findMany: mocks.userFindMany,
				findFirst: mocks.userFindFirst,
			},
			account: {
				findFirst: mocks.accountFindFirst,
			},
		},
		$count: mocks.userCount,
		insert: vi.fn((table: unknown) => ({
			values: vi.fn(() => ({
				returning:
					table === "account"
						? mocks.accountInsert
						: mocks.userInsert,
			})),
		})),
		update: vi.fn(() => ({
			set: vi.fn(() => ({
				where: mocks.userUpdate,
			})),
		})),
	},
}));

import {
	countAllUsers,
	createUser,
	getAccountById,
	getUserByEmail,
	getUserById,
	getUsers,
	updateUser,
} from "./users";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("getUsers", () => {
	it("returns list of users", async () => {
		mocks.userFindMany.mockResolvedValueOnce([{ id: "u1" }]);
		const result = await getUsers({ limit: 10, offset: 0 });
		expect(result).toEqual([{ id: "u1" }]);
	});
});

describe("countAllUsers", () => {
	it("returns the count", async () => {
		mocks.userCount.mockResolvedValueOnce(5);
		const result = await countAllUsers();
		expect(result).toBe(5);
	});
});

describe("getUserById", () => {
	it("returns a user", async () => {
		mocks.userFindFirst.mockResolvedValueOnce({ id: "u2" });
		const result = await getUserById("u2");
		expect(result).toEqual({ id: "u2" });
	});
});

describe("getUserByEmail", () => {
	it("returns a user by email", async () => {
		mocks.userFindFirst.mockResolvedValueOnce({
			id: "u3",
			email: "a@b.com",
		});
		const result = await getUserByEmail("a@b.com");
		expect(result).toEqual({ id: "u3", email: "a@b.com" });
	});
});

describe("createUser", () => {
	it("inserts and returns the new user", async () => {
		mocks.userInsert.mockResolvedValueOnce([{ id: "u4" }]);
		mocks.userFindFirst.mockResolvedValueOnce({
			id: "u4",
			email: "x@y.com",
		});
		const result = await createUser({
			email: "x@y.com",
			name: "Alice",
			role: "user",
			emailVerified: true,
			onboardingComplete: false,
		});
		expect(result).toEqual({ id: "u4", email: "x@y.com" });
	});
});

describe("getAccountById", () => {
	it("returns account by id", async () => {
		mocks.accountFindFirst.mockResolvedValueOnce({ id: "acc1" });
		const result = await getAccountById("acc1");
		expect(result).toEqual({ id: "acc1" });
	});
});

describe("updateUser", () => {
	it("calls update with user data", async () => {
		mocks.userUpdate.mockResolvedValueOnce(undefined);
		await updateUser({ id: "u5", name: "Bob" });
		expect(mocks.userUpdate).toHaveBeenCalledOnce();
	});
});
