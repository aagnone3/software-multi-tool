"use client";

import { config } from "@repo/config";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef } from "react";

const SEQUENCE_TIMEOUT_MS = 1000;

const NAV_SEQUENCES: Record<string, string> = {
	"g h": "/app",
	"g t": "/app/tools",
	"g j": "/app/jobs",
	"g s": "/app/settings",
};

export function KeyboardNavigationShortcuts() {
	const router = useRouter();
	const { activeOrganization } = useActiveOrganization();
	const pendingKey = useRef<string | null>(null);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const buildPath = useCallback(
		(basePath: string) => {
			if (config.organizations.enable && activeOrganization?.slug) {
				return `/${activeOrganization.slug}${basePath}`;
			}
			return basePath;
		},
		[activeOrganization],
	);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			// Don't trigger when typing in inputs
			const tag = (e.target as HTMLElement).tagName.toLowerCase();
			if (tag === "input" || tag === "textarea" || tag === "select") {
				return;
			}
			if (
				(e.target as HTMLElement).isContentEditable ||
				e.metaKey ||
				e.ctrlKey ||
				e.altKey
			) {
				return;
			}

			const key = e.key.toLowerCase();

			if (pendingKey.current) {
				const sequence = `${pendingKey.current} ${key}`;
				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
					timeoutRef.current = null;
				}
				pendingKey.current = null;

				const destination = NAV_SEQUENCES[sequence];
				if (destination) {
					e.preventDefault();
					router.push(buildPath(destination));
				}
				return;
			}

			// Start a sequence if 'g' is pressed
			if (key === "g") {
				pendingKey.current = "g";
				timeoutRef.current = setTimeout(() => {
					pendingKey.current = null;
				}, SEQUENCE_TIMEOUT_MS);
			}
		},
		[router, buildPath],
	);

	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [handleKeyDown]);

	return null;
}
