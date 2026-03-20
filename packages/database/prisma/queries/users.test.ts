import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	userFindMany: vi.fn(),
	userCount: vi.fn(),
	userFindUnique: vi.fn(),
	userCreate: vi.fn(),
	userUpdate: vi.fn(),
	accountFindUnique: vi.fn(),
	accountCreate: vi.fn(),
}));

vi.mock("../client", () => ({
	db: {
		user: {
			findMany: mocks.userFindMany,
			count: mocks.userCount,
			findUnique: mocks.userFindUnique,
			create: mocks.userCreate,
			update: mocks.userUpdate,
		},
		account: {
			findUnique: mocks.accountFindUnique,
			create: mocks.accountCreate,
		},
	},
}));

import {
	countAllUsers,
	createUser,
	createUserAccount,
	getAccountById,
	getUserByEmail,
	getUserById,
	getUsers,
	updateUser,
} from "./users";

describe("users queries", () => {
	beforeEach(() => {
		for (const mock of Object.values(mocks)) {
			mock.mockReset();
		}
	});

	describe("getUsers", () => {
		it("returns users with limit and offset", async () => {
			const mockUsers = [{ id: "u1" }, { id: "u2" }];
			mocks.userFindMany.mockResolvedValue(mockUsers);

			const result = await getUsers({ limit: 10, offset: 0 });

			expect(result).toEqual(mockUsers);
			expect(mocks.userFindMany).toHaveBeenCalledWith({
				where: undefined,
				take: 10,
				skip: 0,
			});
		});

		it("filters by query when provided", async () => {
			mocks.userFindMany.mockResolvedValue([]);

			await getUsers({ limit: 5, offset: 2, query: "john" });

			expect(mocks.userFindMany).toHaveBeenCalledWith({
				where: { name: { contains: "john" } },
				take: 5,
				skip: 2,
			});
		});
	});

	describe("countAllUsers", () => {
		it("returns user count", async () => {
			mocks.userCount.mockResolvedValue(42);

			const result = await countAllUsers();

			expect(result).toBe(42);
			expect(mocks.userCount).toHaveBeenCalled();
		});
	});

	describe("getUserById", () => {
		it("returns user by id", async () => {
			const mockUser = { id: "u1", email: "test@example.com" };
			mocks.userFindUnique.mockResolvedValue(mockUser);

			const result = await getUserById("u1");

			expect(result).toEqual(mockUser);
			expect(mocks.userFindUnique).toHaveBeenCalledWith({
				where: { id: "u1" },
			});
		});

		it("returns null when user not found", async () => {
			mocks.userFindUnique.mockResolvedValue(null);

			const result = await getUserById("non-existent");

			expect(result).toBeNull();
		});
	});

	describe("getUserByEmail", () => {
		it("returns user by email", async () => {
			const mockUser = { id: "u1", email: "test@example.com" };
			mocks.userFindUnique.mockResolvedValue(mockUser);

			const result = await getUserByEmail("test@example.com");

			expect(result).toEqual(mockUser);
			expect(mocks.userFindUnique).toHaveBeenCalledWith({
				where: { email: "test@example.com" },
			});
		});
	});

	describe("createUser", () => {
		it("creates user with correct data", async () => {
			const mockUser = {
				id: "u-new",
				email: "new@example.com",
				name: "New User",
				role: "user",
				emailVerified: false,
				onboardingComplete: false,
			};
			mocks.userCreate.mockResolvedValue(mockUser);

			const result = await createUser({
				email: "new@example.com",
				name: "New User",
				role: "user",
				emailVerified: false,
				onboardingComplete: false,
			});

			expect(result).toEqual(mockUser);
			expect(mocks.userCreate).toHaveBeenCalledWith({
				data: expect.objectContaining({
					email: "new@example.com",
					name: "New User",
					role: "user",
					emailVerified: false,
					onboardingComplete: false,
				}),
			});
		});
	});

	describe("updateUser", () => {
		it("updates user with partial data", async () => {
			const mockUser = { id: "u1", name: "Updated Name" };
			mocks.userUpdate.mockResolvedValue(mockUser);

			const result = await updateUser({ id: "u1", name: "Updated Name" });

			expect(result).toEqual(mockUser);
			expect(mocks.userUpdate).toHaveBeenCalledWith({
				where: { id: "u1" },
				data: { id: "u1", name: "Updated Name" },
			});
		});
	});

	describe("getAccountById", () => {
		it("returns account by id", async () => {
			const mockAccount = {
				id: "acc-1",
				userId: "u1",
				providerId: "google",
			};
			mocks.accountFindUnique.mockResolvedValue(mockAccount);

			const result = await getAccountById("acc-1");

			expect(result).toEqual(mockAccount);
			expect(mocks.accountFindUnique).toHaveBeenCalledWith({
				where: { id: "acc-1" },
			});
		});
	});

	describe("createUserAccount", () => {
		it("creates account with correct data", async () => {
			const mockAccount = {
				id: "acc-new",
				userId: "u1",
				providerId: "credential",
				accountId: "acc-id",
			};
			mocks.accountCreate.mockResolvedValue(mockAccount);

			const result = await createUserAccount({
				userId: "u1",
				providerId: "credential",
				accountId: "acc-id",
				hashedPassword: "hashed123",
			});

			expect(result).toEqual(mockAccount);
			expect(mocks.accountCreate).toHaveBeenCalledWith({
				data: expect.objectContaining({
					userId: "u1",
					providerId: "credential",
					accountId: "acc-id",
					password: "hashed123",
				}),
			});
		});

		it("creates account without password when not provided", async () => {
			mocks.accountCreate.mockResolvedValue({ id: "acc-new" });

			await createUserAccount({
				userId: "u1",
				providerId: "google",
				accountId: "google-id",
			});

			expect(mocks.accountCreate).toHaveBeenCalledWith({
				data: expect.objectContaining({
					password: undefined,
				}),
			});
		});
	});
});
