import { describe, expect, it } from "vitest";
import { buildInvitation } from "./builders/invitation.js";
import { buildMember } from "./builders/member.js";
import { buildOrganization } from "./builders/organization.js";
import { buildPurchase } from "./builders/purchase.js";
import { buildUser } from "./builders/user.js";
import {
	daysFromNow,
	generateEmail,
	generateId,
	generateName,
	now,
} from "./utils.js";

describe("utils", () => {
	describe("generateId", () => {
		it("returns a UUID-like string", () => {
			const id = generateId();
			expect(typeof id).toBe("string");
			expect(id.length).toBeGreaterThan(0);
		});

		it("returns unique IDs", () => {
			const ids = new Set(Array.from({ length: 20 }, () => generateId()));
			expect(ids.size).toBe(20);
		});
	});

	describe("now", () => {
		it("returns a Date", () => {
			expect(now()).toBeInstanceOf(Date);
		});

		it("returns approximately current time", () => {
			const before = Date.now();
			const result = now();
			const after = Date.now();
			expect(result.getTime()).toBeGreaterThanOrEqual(before);
			expect(result.getTime()).toBeLessThanOrEqual(after);
		});
	});

	describe("daysFromNow", () => {
		it("returns a future date for positive days", () => {
			const result = daysFromNow(7);
			expect(result.getTime()).toBeGreaterThan(Date.now());
		});

		it("returns a past date for negative days", () => {
			const result = daysFromNow(-1);
			expect(result.getTime()).toBeLessThan(Date.now());
		});

		it("returns today for 0 days", () => {
			const before = Date.now();
			const result = daysFromNow(0);
			const after = Date.now();
			expect(result.getTime()).toBeGreaterThanOrEqual(before);
			expect(result.getTime()).toBeLessThanOrEqual(after);
		});
	});

	describe("generateEmail", () => {
		it("returns an email with default prefix", () => {
			const email = generateEmail();
			expect(email).toContain("@example.com");
			expect(email).toMatch(/^test-/);
		});

		it("uses custom prefix", () => {
			const email = generateEmail("invite");
			expect(email).toMatch(/^invite-/);
		});

		it("generates unique emails", () => {
			const emails = new Set(
				Array.from({ length: 10 }, () => generateEmail()),
			);
			expect(emails.size).toBe(10);
		});
	});

	describe("generateName", () => {
		it("includes prefix", () => {
			const name = generateName("Test Organization");
			expect(name).toMatch(/^Test Organization-/);
		});

		it("generates unique names", () => {
			const names = new Set(
				Array.from({ length: 10 }, () => generateName("Org")),
			);
			expect(names.size).toBe(10);
		});
	});
});

describe("buildUser", () => {
	it("returns a user with defaults", () => {
		const user = buildUser();
		expect(typeof user.id).toBe("string");
		expect(user.name).toBe("Test User");
		expect(user.email).toContain("@example.com");
		expect(user.emailVerified).toBe(false);
		expect(user.role).toBe("user");
		expect(user.banned).toBe(false);
		expect(user.onboardingComplete).toBe(false);
		expect(user.twoFactorEnabled).toBe(false);
	});

	it("accepts overrides", () => {
		const user = buildUser({
			name: "Alice",
			email: "alice@example.com",
			role: "admin",
		});
		expect(user.name).toBe("Alice");
		expect(user.email).toBe("alice@example.com");
		expect(user.role).toBe("admin");
	});

	it("generates unique IDs", () => {
		const ids = new Set(Array.from({ length: 5 }, () => buildUser().id));
		expect(ids.size).toBe(5);
	});
});

describe("buildOrganization", () => {
	it("returns an organization with defaults", () => {
		const org = buildOrganization();
		expect(typeof org.id).toBe("string");
		expect(org.name).toMatch(/^Test Organization-/);
		expect(org.slug).toBeNull();
		expect(org.logo).toBeNull();
		expect(org.metadata).toBeNull();
		expect(org.paymentsCustomerId).toBeNull();
	});

	it("accepts overrides", () => {
		const org = buildOrganization({ name: "Acme Corp", slug: "acme-corp" });
		expect(org.name).toBe("Acme Corp");
		expect(org.slug).toBe("acme-corp");
	});
});

describe("buildMember", () => {
	it("returns a member with defaults", () => {
		const member = buildMember("org-1", "user-1");
		expect(typeof member.id).toBe("string");
		expect(member.organizationId).toBe("org-1");
		expect(member.userId).toBe("user-1");
		expect(member.role).toBe("member");
		expect(member.createdAt).toBeInstanceOf(Date);
	});

	it("accepts role override", () => {
		const owner = buildMember("org-1", "user-1", { role: "owner" });
		expect(owner.role).toBe("owner");
	});
});

describe("buildInvitation", () => {
	it("returns an invitation with defaults", () => {
		const invitation = buildInvitation("org-1", "inviter-1");
		expect(typeof invitation.id).toBe("string");
		expect(invitation.organizationId).toBe("org-1");
		expect(invitation.inviterId).toBe("inviter-1");
		expect(invitation.role).toBe("member");
		expect(invitation.status).toBe("pending");
		expect(invitation.email).toMatch(/^invite-/);
		expect(invitation.expiresAt).toBeInstanceOf(Date);
		// Expires in the future
		expect((invitation.expiresAt as Date).getTime()).toBeGreaterThan(
			Date.now(),
		);
	});

	it("accepts overrides", () => {
		const accepted = buildInvitation("org-1", "inviter-1", {
			email: "user@example.com",
			status: "accepted",
		});
		expect(accepted.email).toBe("user@example.com");
		expect(accepted.status).toBe("accepted");
	});
});

describe("buildPurchase", () => {
	it("returns a purchase with defaults", () => {
		const purchase = buildPurchase();
		expect(typeof purchase.id).toBe("string");
		expect(purchase.type).toBe("SUBSCRIPTION");
		expect(purchase.status).toBe("active");
		expect(purchase.organizationId).toBeNull();
		expect(purchase.userId).toBeNull();
		expect(purchase.subscriptionId).toBeNull();
		expect(purchase.customerId).toMatch(/^cus_/);
		expect(purchase.productId).toMatch(/^prod_/);
	});

	it("accepts org purchase overrides", () => {
		const purchase = buildPurchase({
			organizationId: "org-1",
			type: "ONE_TIME",
		});
		expect(purchase.organizationId).toBe("org-1");
		expect(purchase.type).toBe("ONE_TIME");
	});

	it("accepts user purchase overrides", () => {
		const purchase = buildPurchase({ userId: "user-1" });
		expect(purchase.userId).toBe("user-1");
	});
});
