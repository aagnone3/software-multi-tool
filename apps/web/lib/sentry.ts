import type { Session } from "@repo/auth";
import * as Sentry from "@sentry/nextjs";

interface UserContext {
	id: string;
	email?: string;
	name?: string;
	username?: string;
}

interface OrganizationContext {
	id: string;
	name?: string;
	slug?: string;
}

/**
 * Set user context in Sentry for error tracking and session replay.
 * This enriches error reports with user information.
 */
export function setSentryUserContext(user: UserContext | null) {
	if (!user) {
		Sentry.setUser(null);
		return;
	}

	Sentry.setUser({
		id: user.id,
		email: user.email,
		username: user.username || user.name,
	});
}

/**
 * Set organization context in Sentry as a tag.
 * This allows filtering errors by organization.
 */
export function setSentryOrganizationContext(
	organization: OrganizationContext | null,
) {
	if (!organization) {
		Sentry.setTag("organization.id", undefined);
		Sentry.setTag("organization.name", undefined);
		Sentry.setTag("organization.slug", undefined);
		return;
	}

	Sentry.setTag("organization.id", organization.id);
	if (organization.name) {
		Sentry.setTag("organization.name", organization.name);
	}
	if (organization.slug) {
		Sentry.setTag("organization.slug", organization.slug);
	}
}

/**
 * Set user context from Better Auth session.
 * Use this in API routes and server components.
 */
export function setSentryContextFromSession(session: Session | null) {
	if (!session?.user) {
		setSentryUserContext(null);
		return;
	}

	setSentryUserContext({
		id: session.user.id,
		email: session.user.email,
		name: session.user.name,
	});
}

/**
 * Capture an exception in Sentry with additional context.
 */
export function captureException(
	error: Error,
	context?: Record<string, unknown>,
) {
	if (context) {
		Sentry.setContext("additional_context", context);
	}
	Sentry.captureException(error);
}

/**
 * Capture a message in Sentry with a severity level.
 */
export function captureMessage(
	message: string,
	level: "fatal" | "error" | "warning" | "info" | "debug" = "info",
) {
	Sentry.captureMessage(message, level);
}
