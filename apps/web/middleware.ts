import { config as appConfig } from "@repo/config";
import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { withQuery } from "ufo";

/**
 * Check if a tool route is public (accessible without authentication)
 */
function isPublicToolRoute(pathname: string): boolean {
	if (!pathname.startsWith("/app/tools")) {
		return false;
	}

	// /app/tools listing page is always public
	if (pathname === "/app/tools") {
		return true;
	}

	// Check if the specific tool is marked as public
	const toolSlug = pathname.split("/app/tools/")[1]?.split("/")[0];
	if (!toolSlug) {
		return false;
	}

	const tool = appConfig.tools.registry.find(
		(t) => t.slug === toolSlug && t.enabled,
	);
	return tool?.public ?? false;
}

export default async function middleware(req: NextRequest) {
	const { pathname, origin } = req.nextUrl;

	const sessionCookie = getSessionCookie(req);

	if (pathname.startsWith("/app")) {
		const response = NextResponse.next();

		if (!appConfig.ui.saas.enabled) {
			return NextResponse.redirect(new URL("/", origin));
		}

		// Allow public tool routes without authentication
		if (isPublicToolRoute(pathname)) {
			return response;
		}

		if (!sessionCookie) {
			return NextResponse.redirect(
				new URL(
					withQuery("/auth/login", {
						redirectTo: pathname,
					}),
					origin,
				),
			);
		}

		return response;
	}

	if (pathname.startsWith("/auth")) {
		if (!appConfig.ui.saas.enabled) {
			return NextResponse.redirect(new URL("/", origin));
		}

		return NextResponse.next();
	}

	if (!appConfig.ui.marketing.enabled) {
		return NextResponse.redirect(new URL("/app", origin));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/((?!api|image-proxy|images|fonts|_next/static|_next/image|favicon.ico|icon.png|sitemap.xml|robots.txt).*)",
	],
};
