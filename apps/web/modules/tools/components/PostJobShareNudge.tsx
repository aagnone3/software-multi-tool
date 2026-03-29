"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import { CheckIcon, Share2Icon, XIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface PostJobShareNudgeProps {
	toolSlug?: string;
	className?: string;
}

const STORAGE_KEY_PREFIX = "share-nudge-dismissed-";

/**
 * Appears after a successful job completion with a prompt to share the tool with a colleague.
 * Dismissed per-tool and stored in localStorage to avoid repeat noise.
 */
export function PostJobShareNudge({
	toolSlug,
	className,
}: PostJobShareNudgeProps) {
	const { activeOrganization } = useActiveOrganization();
	const [show, setShow] = useState(false);
	const [copied, setCopied] = useState(false);

	const storageKey = `${STORAGE_KEY_PREFIX}${toolSlug ?? "default"}`;

	useEffect(() => {
		const dismissed = localStorage.getItem(storageKey);
		if (dismissed === "true") return;
		// Delay so it shows after the upgrade nudge
		const timer = setTimeout(() => setShow(true), 1200);
		return () => clearTimeout(timer);
	}, [storageKey]);

	const handleDismiss = () => {
		localStorage.setItem(storageKey, "true");
		setShow(false);
	};

	const handleCopyLink = async () => {
		const toolPath = toolSlug ? `/tools/${toolSlug}` : "/tools";
		const url = `${window.location.origin}${toolPath}`;
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			toast.success("Link copied! Share it with your team.");
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Couldn't copy link — try manually.");
		}
	};

	if (!show) return null;

	return (
		<aside
			className={cn(
				"relative mt-4 rounded-lg border border-border bg-muted/30 p-4",
				className,
			)}
			aria-label="Share prompt"
		>
			<button
				type="button"
				onClick={handleDismiss}
				className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
				aria-label="Dismiss"
			>
				<XIcon className="size-4" />
			</button>

			<div className="flex items-start gap-3 pr-6">
				<div className="flex size-8 flex-none items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
					<Share2Icon className="size-4" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="font-semibold text-sm">
						Know someone who'd find this useful?
					</p>
					<p className="mt-0.5 text-muted-foreground text-sm">
						Share this tool with a colleague — help them save time
						too.
					</p>
					<div className="mt-3 flex flex-wrap gap-2">
						<Button
							size="sm"
							variant="outline"
							className="gap-1.5"
							onClick={handleCopyLink}
						>
							{copied ? (
								<CheckIcon className="size-3.5 text-green-500" />
							) : (
								<Share2Icon className="size-3.5" />
							)}
							{copied ? "Copied!" : "Copy link"}
						</Button>
					</div>
				</div>
			</div>
		</aside>
	);
}
