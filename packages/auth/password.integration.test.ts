import type { PostgresTestHarness } from "@repo/database/tests/postgres-test-harness";
import { createPostgresTestHarness } from "@repo/database/tests/postgres-test-harness";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";

const HOOK_TIMEOUT = 120_000;
const TEST_TIMEOUT = 20_000;

describe.sequential("Password hashing integration tests", () => {
	let harness: PostgresTestHarness | undefined;

	beforeAll(async () => {
		harness = await createPostgresTestHarness();
		await harness.resetDatabase();
	}, HOOK_TIMEOUT);

	beforeEach(async () => {
		await harness?.resetDatabase();
		vi.clearAllMocks();
	});

	afterAll(async () => {
		await harness?.cleanup();
	}, HOOK_TIMEOUT);

	const requirePrisma = () => {
		if (!harness) {
			throw new Error("Postgres test harness did not initialize.");
		}
		return harness.prisma;
	};

	describe("Better Auth password hashing", () => {
		it(
			"can hash and verify a password",
			async () => {
				const password = "PreviewPassword123!";

				// Hash the password using Better Auth's crypto
				const hashedPassword = await hashPassword(password);

				console.log("Hashed password:", hashedPassword);
				console.log("Hash length:", hashedPassword.length);

				// Verify the password matches
				const isValid = await verifyPassword({
					hash: hashedPassword,
					password,
				});

				expect(isValid).toBe(true);
			},
			TEST_TIMEOUT,
		);

		it(
			"rejects incorrect password",
			async () => {
				const password = "PreviewPassword123!";
				const wrongPassword = "WrongPassword456!";

				const hashedPassword = await hashPassword(password);

				const isValid = await verifyPassword({
					hash: hashedPassword,
					password: wrongPassword,
				});

				expect(isValid).toBe(false);
			},
			TEST_TIMEOUT,
		);

		it(
			"can create a user with hashed password and sign in",
			async () => {
				const prisma = requirePrisma();
				const email = "test@preview.local";
				const password = "PreviewPassword123!";

				// Hash the password using Better Auth's crypto
				const hashedPassword = await hashPassword(password);

				// Create user
				const user = await prisma.user.create({
					data: {
						id: "test_user_001",
						email,
						name: "Test User",
						emailVerified: true,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				// Create account with hashed password
				await prisma.account.create({
					data: {
						id: "test_account_001",
						userId: user.id,
						providerId: "credential",
						accountId: user.id,
						password: hashedPassword,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				// Verify the account was created with the password
				const account = await prisma.account.findFirst({
					where: { userId: user.id, providerId: "credential" },
				});

				expect(account).not.toBeNull();
				expect(account?.password).toBe(hashedPassword);

				// Verify the password can be validated
				const isValid = await verifyPassword({
					hash: account!.password!,
					password,
				});

				expect(isValid).toBe(true);

				// Output the hash for use in seed.sql
				console.log("\n=== Use this hash in seed.sql ===");
				console.log(`Password: ${password}`);
				console.log(`Hash: ${hashedPassword}`);
				console.log("================================\n");
			},
			TEST_TIMEOUT,
		);
	});
});
