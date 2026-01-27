"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import { BarChart3Icon, MessageSquareIcon, WrenchIcon } from "lucide-react";
import Link from "next/link";

interface QuickActionsProps {
	className?: string;
}

export function QuickActions({ className }: QuickActionsProps) {
	const { activeOrganization } = useActiveOrganization();

	const basePath = activeOrganization
		? `/app/${activeOrganization.slug}`
		: "/app";

	const actions = [
		{
			label: "New Chat",
			href: `${basePath}/chatbot`,
			icon: MessageSquareIcon,
			description: "Start an AI conversation",
		},
		{
			label: "Browse Tools",
			href: `${basePath}/tools`,
			icon: WrenchIcon,
			description: "Explore available tools",
		},
		{
			label: "View Usage",
			href: `${basePath}/settings/billing/usage`,
			icon: BarChart3Icon,
			description: "Check your credits usage",
		},
	];

	return (
		<div className={cn("flex flex-wrap gap-3", className)}>
			{actions.map((action) => (
				<Button
					key={action.href}
					variant="outline"
					size="lg"
					className="flex-1 min-w-[140px] h-auto py-3 px-4 gap-3 justify-start"
					asChild
				>
					<Link href={action.href}>
						<action.icon className="size-5 shrink-0 text-primary" />
						<div className="text-left">
							<p className="font-medium">{action.label}</p>
							<p className="text-xs text-muted-foreground font-normal">
								{action.description}
							</p>
						</div>
					</Link>
				</Button>
			))}
		</div>
	);
}
