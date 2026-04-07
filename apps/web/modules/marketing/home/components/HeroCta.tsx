"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { Button } from "@ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import React, { useCallback } from "react";

export function HeroCta() {
	const { track } = useProductAnalytics();

	const handleSignupClick = useCallback(() => {
		track({
			name: "hero_cta_clicked",
			props: { cta: "signup", position: "hero" },
		});
	}, [track]);

	const handleToolsClick = useCallback(() => {
		track({
			name: "hero_cta_clicked",
			props: { cta: "see_all_tools", position: "hero" },
		});
	}, [track]);

	return (
		<div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
			<Button size="lg" variant="primary" asChild>
				<Link href="/auth/signup" onClick={handleSignupClick}>
					Get 10 Free Credits — No Card Required
					<ArrowRightIcon className="ml-2 size-4" />
				</Link>
			</Button>
			<Button variant="outline" size="lg" asChild>
				<Link href="/tools" onClick={handleToolsClick}>
					See All Tools
				</Link>
			</Button>
		</div>
	);
}
