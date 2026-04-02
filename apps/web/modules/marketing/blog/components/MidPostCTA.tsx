"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { Button } from "@ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

/**
 * A lightweight inline CTA used in the middle of long blog posts.
 * Intentionally simpler than BlogCTA to avoid disrupting reading flow.
 */
export function MidPostCTA() {
	const { track } = useProductAnalytics();
	const pathname = usePathname();
	const postSlug = pathname?.split("/").pop() ?? "unknown";

	return (
		<aside className="my-8 flex items-center gap-4 rounded-lg border border-primary/15 bg-primary/5 px-5 py-4">
			<div className="flex-1">
				<p className="font-semibold text-sm">
					Want to skip the manual work?
				</p>
				<p className="mt-0.5 text-foreground/60 text-xs">
					Try the AI tool for free — no credit card required.
				</p>
			</div>
			<Button asChild size="sm" variant="primary">
				<Link
					href="/auth/signup"
					onClick={() =>
						track({
							name: "marketing_mid_post_cta_clicked",
							props: { post_slug: postSlug },
						})
					}
				>
					Get started free
					<ArrowRightIcon className="ml-1.5 size-3.5" />
				</Link>
			</Button>
		</aside>
	);
}
