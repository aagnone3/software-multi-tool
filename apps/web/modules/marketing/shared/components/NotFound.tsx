"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { Button } from "@ui/components/button";
import { HomeIcon, LayoutGridIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";

export function NotFound() {
	const { track } = useProductAnalytics();
	const pathname = usePathname();

	useEffect(() => {
		track({
			name: "page_not_found",
			props: { path: pathname ?? "unknown" },
		});
	}, [track, pathname]);

	return (
		<div className="flex h-screen flex-col items-center justify-center gap-4 px-4 text-center">
			<h1 className="font-bold text-5xl">404</h1>
			<p className="text-2xl">Page not found</p>
			<p className="max-w-md text-muted-foreground text-sm">
				This page doesn&apos;t exist. Try browsing our AI tools or head
				back home.
			</p>
			<div className="flex flex-wrap justify-center gap-3">
				<Button asChild>
					<Link href="/tools">
						<LayoutGridIcon
							className="mr-2 size-4"
							aria-hidden="true"
						/>
						Browse AI tools
					</Link>
				</Button>
				<Button asChild variant="outline">
					<Link href="/">
						<HomeIcon className="mr-2 size-4" aria-hidden="true" />{" "}
						Go to homepage
					</Link>
				</Button>
			</div>
		</div>
	);
}
