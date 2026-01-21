import { describe, expect, it } from "vitest";
import {
	buildOrgPath,
	buildSystemPath,
	buildUserPath,
	isLegacyPath,
	isMultiTenantPath,
	PathValidationError,
	parsePath,
} from "./paths";

// ============================================================================
// Test fixtures
// ============================================================================

// Valid UUIDs for testing
const VALID_ORG_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const VALID_USER_ID = "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e";

// Invalid UUIDs
const INVALID_UUID_SHORT = "not-a-uuid";
const EMPTY_STRING = "";

// ============================================================================
// buildOrgPath tests
// ============================================================================

describe("buildOrgPath", () => {
	describe("valid inputs", () => {
		it("builds path for organization logo", () => {
			const path = buildOrgPath({
				organizationId: VALID_ORG_ID,
				fileType: "logo.png",
			});
			expect(path).toBe(`organizations/${VALID_ORG_ID}/logo.png`);
		});

		it("builds path for organization asset", () => {
			const path = buildOrgPath({
				organizationId: VALID_ORG_ID,
				fileType: "header-image.jpg",
			});
			expect(path).toBe(`organizations/${VALID_ORG_ID}/header-image.jpg`);
		});

		it("handles file types with underscores", () => {
			const path = buildOrgPath({
				organizationId: VALID_ORG_ID,
				fileType: "org_logo.png",
			});
			expect(path).toBe(`organizations/${VALID_ORG_ID}/org_logo.png`);
		});

		it("handles file types without extension", () => {
			const path = buildOrgPath({
				organizationId: VALID_ORG_ID,
				fileType: "logo",
			});
			expect(path).toBe(`organizations/${VALID_ORG_ID}/logo`);
		});
	});

	describe("invalid organization IDs", () => {
		it("throws for empty organization ID", () => {
			expect(() =>
				buildOrgPath({
					organizationId: EMPTY_STRING,
					fileType: "logo.png",
				}),
			).toThrow(PathValidationError);
		});

		it("throws for invalid UUID format", () => {
			expect(() =>
				buildOrgPath({
					organizationId: INVALID_UUID_SHORT,
					fileType: "logo.png",
				}),
			).toThrow(PathValidationError);
		});

		it("includes error details for invalid org ID", () => {
			try {
				buildOrgPath({
					organizationId: INVALID_UUID_SHORT,
					fileType: "logo.png",
				});
				expect.fail("Should have thrown");
			} catch (e) {
				expect(e).toBeInstanceOf(PathValidationError);
				const error = e as PathValidationError;
				expect(error.code).toBe("INVALID_ORG_ID");
				expect(error.details?.provided).toBe(INVALID_UUID_SHORT);
			}
		});
	});

	describe("invalid file types", () => {
		it("throws for empty file type", () => {
			expect(() =>
				buildOrgPath({
					organizationId: VALID_ORG_ID,
					fileType: EMPTY_STRING,
				}),
			).toThrow(PathValidationError);
		});

		it("throws for path traversal attempts", () => {
			expect(() =>
				buildOrgPath({
					organizationId: VALID_ORG_ID,
					fileType: "../secret.txt",
				}),
			).toThrow(PathValidationError);
		});

		it("throws for file types with slashes", () => {
			expect(() =>
				buildOrgPath({
					organizationId: VALID_ORG_ID,
					fileType: "subdir/logo.png",
				}),
			).toThrow(PathValidationError);
		});

		it("includes error details for invalid file type", () => {
			try {
				buildOrgPath({
					organizationId: VALID_ORG_ID,
					fileType: "../evil.txt",
				});
				expect.fail("Should have thrown");
			} catch (e) {
				expect(e).toBeInstanceOf(PathValidationError);
				const error = e as PathValidationError;
				expect(error.code).toBe("INVALID_FILE_TYPE");
				expect(error.details?.provided).toBe("../evil.txt");
			}
		});
	});
});

// ============================================================================
// buildUserPath tests
// ============================================================================

describe("buildUserPath", () => {
	describe("valid inputs", () => {
		it("builds path for user avatar", () => {
			const path = buildUserPath({
				organizationId: VALID_ORG_ID,
				userId: VALID_USER_ID,
				fileType: "avatar.png",
			});
			expect(path).toBe(
				`organizations/${VALID_ORG_ID}/users/${VALID_USER_ID}/avatar.png`,
			);
		});

		it("builds path for user profile photo", () => {
			const path = buildUserPath({
				organizationId: VALID_ORG_ID,
				userId: VALID_USER_ID,
				fileType: "profile-photo.jpg",
			});
			expect(path).toBe(
				`organizations/${VALID_ORG_ID}/users/${VALID_USER_ID}/profile-photo.jpg`,
			);
		});
	});

	describe("invalid organization IDs", () => {
		it("throws for empty organization ID", () => {
			expect(() =>
				buildUserPath({
					organizationId: EMPTY_STRING,
					userId: VALID_USER_ID,
					fileType: "avatar.png",
				}),
			).toThrow(PathValidationError);
		});

		it("throws for invalid UUID format", () => {
			expect(() =>
				buildUserPath({
					organizationId: INVALID_UUID_SHORT,
					userId: VALID_USER_ID,
					fileType: "avatar.png",
				}),
			).toThrow(PathValidationError);
		});

		it("includes error code INVALID_ORG_ID", () => {
			try {
				buildUserPath({
					organizationId: INVALID_UUID_SHORT,
					userId: VALID_USER_ID,
					fileType: "avatar.png",
				});
				expect.fail("Should have thrown");
			} catch (e) {
				expect(e).toBeInstanceOf(PathValidationError);
				expect((e as PathValidationError).code).toBe("INVALID_ORG_ID");
			}
		});
	});

	describe("invalid user IDs", () => {
		it("throws for empty user ID", () => {
			expect(() =>
				buildUserPath({
					organizationId: VALID_ORG_ID,
					userId: EMPTY_STRING,
					fileType: "avatar.png",
				}),
			).toThrow(PathValidationError);
		});

		it("throws for invalid UUID format", () => {
			expect(() =>
				buildUserPath({
					organizationId: VALID_ORG_ID,
					userId: INVALID_UUID_SHORT,
					fileType: "avatar.png",
				}),
			).toThrow(PathValidationError);
		});

		it("includes error code INVALID_USER_ID", () => {
			try {
				buildUserPath({
					organizationId: VALID_ORG_ID,
					userId: INVALID_UUID_SHORT,
					fileType: "avatar.png",
				});
				expect.fail("Should have thrown");
			} catch (e) {
				expect(e).toBeInstanceOf(PathValidationError);
				expect((e as PathValidationError).code).toBe("INVALID_USER_ID");
			}
		});
	});

	describe("invalid file types", () => {
		it("throws for empty file type", () => {
			expect(() =>
				buildUserPath({
					organizationId: VALID_ORG_ID,
					userId: VALID_USER_ID,
					fileType: EMPTY_STRING,
				}),
			).toThrow(PathValidationError);
		});

		it("throws for path traversal attempts", () => {
			expect(() =>
				buildUserPath({
					organizationId: VALID_ORG_ID,
					userId: VALID_USER_ID,
					fileType: "../../etc/passwd",
				}),
			).toThrow(PathValidationError);
		});
	});
});

// ============================================================================
// buildSystemPath tests
// ============================================================================

describe("buildSystemPath", () => {
	describe("valid inputs", () => {
		it("builds path for system asset", () => {
			const path = buildSystemPath({
				pathType: "default-avatar.png",
			});
			expect(path).toBe("system/default-avatar.png");
		});

		it("builds path with subdirectory", () => {
			const path = buildSystemPath({
				pathType: "assets/default-avatar.png",
			});
			expect(path).toBe("system/assets/default-avatar.png");
		});

		it("builds path with nested subdirectories", () => {
			const path = buildSystemPath({
				pathType: "templates/email/header.png",
			});
			expect(path).toBe("system/templates/email/header.png");
		});
	});

	describe("invalid path types", () => {
		it("throws for empty path type", () => {
			expect(() =>
				buildSystemPath({
					pathType: EMPTY_STRING,
				}),
			).toThrow(PathValidationError);
		});

		it("throws for path traversal attempts", () => {
			expect(() =>
				buildSystemPath({
					pathType: "../etc/passwd",
				}),
			).toThrow(PathValidationError);
		});

		it("includes error code INVALID_SYSTEM_PATH", () => {
			try {
				buildSystemPath({
					pathType: "../secret",
				});
				expect.fail("Should have thrown");
			} catch (e) {
				expect(e).toBeInstanceOf(PathValidationError);
				expect((e as PathValidationError).code).toBe(
					"INVALID_SYSTEM_PATH",
				);
			}
		});
	});
});

// ============================================================================
// parsePath tests
// ============================================================================

describe("parsePath", () => {
	describe("organization paths", () => {
		it("parses organization-level path", () => {
			const result = parsePath(`organizations/${VALID_ORG_ID}/logo.png`);
			expect(result).toEqual({
				type: "organization",
				organizationId: VALID_ORG_ID,
				fileType: "logo.png",
			});
		});

		it("handles organization path with subdirectory", () => {
			const result = parsePath(
				`organizations/${VALID_ORG_ID}/assets/header.png`,
			);
			expect(result).toEqual({
				type: "organization",
				organizationId: VALID_ORG_ID,
				fileType: "assets/header.png",
			});
		});
	});

	describe("user paths", () => {
		it("parses user-scoped path", () => {
			const result = parsePath(
				`organizations/${VALID_ORG_ID}/users/${VALID_USER_ID}/avatar.png`,
			);
			expect(result).toEqual({
				type: "user",
				organizationId: VALID_ORG_ID,
				userId: VALID_USER_ID,
				fileType: "avatar.png",
			});
		});
	});

	describe("system paths", () => {
		it("parses system path", () => {
			const result = parsePath("system/assets/default-avatar.png");
			expect(result).toEqual({
				type: "system",
				pathType: "assets/default-avatar.png",
			});
		});

		it("parses simple system path", () => {
			const result = parsePath("system/default.png");
			expect(result).toEqual({
				type: "system",
				pathType: "default.png",
			});
		});
	});

	describe("legacy paths", () => {
		it("identifies legacy user path", () => {
			const result = parsePath("users/user123/avatar.png");
			expect(result).toEqual({
				type: "legacy",
				rawPath: "users/user123/avatar.png",
			});
		});

		it("identifies unknown path format as legacy", () => {
			const result = parsePath("random/path/to/file.png");
			expect(result).toEqual({
				type: "legacy",
				rawPath: "random/path/to/file.png",
			});
		});

		it("identifies incomplete organization path as legacy", () => {
			const result = parsePath("organizations/");
			expect(result).toEqual({
				type: "legacy",
				rawPath: "organizations/",
			});
		});
	});
});

// ============================================================================
// isLegacyPath tests
// ============================================================================

describe("isLegacyPath", () => {
	it("returns true for legacy user path", () => {
		expect(isLegacyPath("users/user123/avatar.png")).toBe(true);
	});

	it("returns true for unknown path format", () => {
		expect(isLegacyPath("random/path/file.png")).toBe(true);
	});

	it("returns false for organization path", () => {
		expect(isLegacyPath(`organizations/${VALID_ORG_ID}/logo.png`)).toBe(
			false,
		);
	});

	it("returns false for user path in new format", () => {
		expect(
			isLegacyPath(
				`organizations/${VALID_ORG_ID}/users/${VALID_USER_ID}/avatar.png`,
			),
		).toBe(false);
	});

	it("returns false for system path", () => {
		expect(isLegacyPath("system/default.png")).toBe(false);
	});
});

// ============================================================================
// isMultiTenantPath tests
// ============================================================================

describe("isMultiTenantPath", () => {
	it("returns true for organization path", () => {
		expect(
			isMultiTenantPath(`organizations/${VALID_ORG_ID}/logo.png`),
		).toBe(true);
	});

	it("returns true for user path in new format", () => {
		expect(
			isMultiTenantPath(
				`organizations/${VALID_ORG_ID}/users/${VALID_USER_ID}/avatar.png`,
			),
		).toBe(true);
	});

	it("returns true for system path", () => {
		expect(isMultiTenantPath("system/default.png")).toBe(true);
	});

	it("returns false for legacy user path", () => {
		expect(isMultiTenantPath("users/user123/avatar.png")).toBe(false);
	});

	it("returns false for unknown path format", () => {
		expect(isMultiTenantPath("random/path/file.png")).toBe(false);
	});
});

// ============================================================================
// PathValidationError tests
// ============================================================================

describe("PathValidationError", () => {
	it("has correct name", () => {
		const error = new PathValidationError("INVALID_ORG_ID", "Test message");
		expect(error.name).toBe("PathValidationError");
	});

	it("includes code", () => {
		const error = new PathValidationError(
			"INVALID_USER_ID",
			"Test message",
		);
		expect(error.code).toBe("INVALID_USER_ID");
	});

	it("includes message", () => {
		const error = new PathValidationError(
			"INVALID_FILE_TYPE",
			"File type is invalid",
		);
		expect(error.message).toBe("File type is invalid");
	});

	it("includes details when provided", () => {
		const error = new PathValidationError(
			"INVALID_ORG_ID",
			"Test message",
			{ provided: "bad-value", expected: "uuid" },
		);
		expect(error.details).toEqual({
			provided: "bad-value",
			expected: "uuid",
		});
	});
});
