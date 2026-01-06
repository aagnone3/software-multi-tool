"use client";

import { config } from "@repo/config";
import { useSession } from "@saas/auth/hooks/use-session";
import { UserMenu } from "@saas/shared/components/UserMenu";
import { Logo } from "@shared/components/Logo";
import { Button } from "@ui/components/button";
import { GridIcon, HomeIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function ToolsNavBar() {
	const pathname = usePathname();
	const { user } = useSession();

	const enabledTools = config.tools.registry.filter((tool) => tool.enabled);

	return (
		<nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container max-w-6xl flex h-16 items-center justify-between px-4">
				<div className="flex items-center gap-6">
					<Link href="/app" className="flex items-center gap-2">
						<Logo withLabel={false} />
					</Link>

					<div className="hidden items-center gap-1 md:flex">
						<Link href="/app/tools">
							<Button
								variant={
									pathname === "/app/tools"
										? "secondary"
										: "ghost"
								}
								size="sm"
								className="gap-2"
							>
								<GridIcon className="size-4" />
								All Tools
							</Button>
						</Link>

						{enabledTools.slice(0, 3).map((tool) => (
							<Link
								key={tool.slug}
								href={`/app/tools/${tool.slug}`}
							>
								<Button
									variant={
										pathname === `/app/tools/${tool.slug}`
											? "secondary"
											: "ghost"
									}
									size="sm"
								>
									{tool.name}
								</Button>
							</Link>
						))}
					</div>
				</div>

				<div className="flex items-center gap-4">
					<Link href="/app">
						<Button variant="ghost" size="sm" className="gap-2">
							<HomeIcon className="size-4" />
							<span className="hidden sm:inline">Dashboard</span>
						</Button>
					</Link>

					{user ? (
						<UserMenu />
					) : (
						<Link href="/auth/login">
							<Button size="sm">Sign In</Button>
						</Link>
					)}
				</div>
			</div>
		</nav>
	);
}
