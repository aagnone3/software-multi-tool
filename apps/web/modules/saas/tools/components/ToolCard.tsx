import type { ToolConfig } from "@repo/config/types";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@ui/components/tooltip";
import { cn } from "@ui/lib";
import {
	ClipboardListIcon,
	ClockIcon,
	FileTextIcon,
	ImageMinusIcon,
	MessageSquareTextIcon,
	NewspaperIcon,
	ReceiptIcon,
	UsersIcon,
	WalletIcon,
	WrenchIcon,
} from "lucide-react";
import Link from "next/link";

interface ToolCardProps {
	tool: ToolConfig;
	/** Whether this tool is coming soon (disabled but visible) */
	isComingSoon?: boolean;
}

function getToolIcon(iconName: string) {
	const icons: Record<string, React.ComponentType<{ className?: string }>> = {
		"image-minus": ImageMinusIcon,
		users: UsersIcon,
		newspaper: NewspaperIcon,
		receipt: ReceiptIcon,
		"file-text": FileTextIcon,
		"message-square-text": MessageSquareTextIcon,
		wallet: WalletIcon,
		"clipboard-list": ClipboardListIcon,
	};

	return icons[iconName] || WrenchIcon;
}

export function ToolCard({ tool, isComingSoon = false }: ToolCardProps) {
	const Icon = getToolIcon(tool.icon);

	if (isComingSoon) {
		return (
			<Card
				className={cn(
					"group flex h-full flex-col transition-all",
					"opacity-60 grayscale hover:opacity-70",
				)}
			>
				<CardHeader className="flex-1">
					<div className="mb-2 flex items-center gap-2">
						<div className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
							<Icon className="size-6" />
						</div>
						<span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
							<ClockIcon className="size-3" />
							Coming Soon
						</span>
					</div>
					<CardTitle className="text-lg text-muted-foreground">
						{tool.name}
					</CardTitle>
					<CardDescription>{tool.description}</CardDescription>
				</CardHeader>
				<CardContent className="pt-0">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									className="w-full cursor-not-allowed"
									variant="outline"
									disabled
								>
									Coming Soon
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>This tool is coming soon</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="group flex h-full flex-col transition-all hover:border-primary/50 hover:shadow-md">
			<CardHeader className="flex-1">
				<div className="mb-2 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<Icon className="size-6" />
				</div>
				<CardTitle className="text-lg">{tool.name}</CardTitle>
				<CardDescription>{tool.description}</CardDescription>
			</CardHeader>
			<CardContent className="pt-0">
				<Link href={`/app/tools/${tool.slug}`}>
					<Button className="w-full" variant="outline">
						Open Tool
					</Button>
				</Link>
			</CardContent>
		</Card>
	);
}
