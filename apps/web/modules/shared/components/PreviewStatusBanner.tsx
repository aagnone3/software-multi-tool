"use client";

import { cn } from "@ui/lib";
import { AlertTriangleIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useApiStatus } from "../hooks/use-api-status";

interface PreviewStatusBannerProps {
	className?: string;
}

/**
 * Banner displayed in preview environments when the API is unavailable.
 * Shows a helpful message indicating the API is still initializing.
 * Can be dismissed by the user.
 */
export function PreviewStatusBanner({ className }: PreviewStatusBannerProps) {
	const { isAvailable, isChecking, isPreview } = useApiStatus();
	const [isDismissed, setIsDismissed] = useState(false);

	// Only show in preview environments when API is unavailable
	if (!isPreview || isAvailable || isChecking || isDismissed) {
		return null;
	}

	return (
		<div
			className={cn(
				"flex items-center justify-between gap-4 bg-amber-100 px-4 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
				className,
			)}
			role="alert"
		>
			<div className="flex items-center gap-2">
				<AlertTriangleIcon className="size-4 shrink-0" />
				<p>
					<span className="font-medium">
						Preview API initializing.
					</span>{" "}
					Some features may be temporarily unavailable. This typically
					resolves within a few minutes after PR creation.
				</p>
			</div>
			<button
				type="button"
				onClick={() => setIsDismissed(true)}
				className="shrink-0 rounded p-1 hover:bg-amber-200/50 dark:hover:bg-amber-800/50"
				aria-label="Dismiss banner"
			>
				<XIcon className="size-4" />
			</button>
		</div>
	);
}
