"use client";

import { useEffect, useId, useRef } from "react";

const TURNSTILE_SCRIPT_SRC =
	"https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

declare global {
	interface Window {
		turnstile?: {
			render: (
				container: string | HTMLElement,
				params: {
					sitekey: string;
					callback?: (token: string) => void;
					"expired-callback"?: () => void;
					"error-callback"?: () => void;
					theme?: "light" | "dark" | "auto";
				},
			) => string;
			remove: (widgetId: string) => void;
			reset: (widgetId?: string) => void;
		};
	}
}

let scriptLoadPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
	if (typeof window === "undefined") {
		return Promise.resolve();
	}
	if (window.turnstile) {
		return Promise.resolve();
	}
	if (scriptLoadPromise) {
		return scriptLoadPromise;
	}
	scriptLoadPromise = new Promise<void>((resolve, reject) => {
		const existing = document.querySelector<HTMLScriptElement>(
			`script[src="${TURNSTILE_SCRIPT_SRC}"]`,
		);
		if (existing) {
			existing.addEventListener("load", () => resolve());
			existing.addEventListener("error", () =>
				reject(new Error("turnstile_script_failed")),
			);
			return;
		}
		const script = document.createElement("script");
		script.src = TURNSTILE_SCRIPT_SRC;
		script.async = true;
		script.defer = true;
		script.addEventListener("load", () => resolve());
		script.addEventListener("error", () =>
			reject(new Error("turnstile_script_failed")),
		);
		document.head.appendChild(script);
	});
	return scriptLoadPromise;
}

interface TurnstileWidgetProps {
	siteKey: string;
	onToken: (token: string | undefined) => void;
}

export function TurnstileWidget({ siteKey, onToken }: TurnstileWidgetProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const widgetIdRef = useRef<string | null>(null);
	const id = useId();

	useEffect(() => {
		let cancelled = false;
		loadTurnstileScript()
			.then(() => {
				if (cancelled || !containerRef.current || !window.turnstile) {
					return;
				}
				widgetIdRef.current = window.turnstile.render(
					containerRef.current,
					{
						sitekey: siteKey,
						callback: (token) => onToken(token),
						"expired-callback": () => onToken(undefined),
						"error-callback": () => onToken(undefined),
					},
				);
			})
			.catch(() => {
				// Surface failure as "no token"; server will reject the
				// submission when TURNSTILE_SECRET_KEY is configured.
				onToken(undefined);
			});

		return () => {
			cancelled = true;
			if (widgetIdRef.current && window.turnstile) {
				window.turnstile.remove(widgetIdRef.current);
				widgetIdRef.current = null;
			}
		};
	}, [siteKey, onToken]);

	return <div ref={containerRef} id={`turnstile-${id}`} />;
}
