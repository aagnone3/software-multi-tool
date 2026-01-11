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
	ClipboardListIcon,
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

export function ToolCard({ tool }: ToolCardProps) {
	const Icon = getToolIcon(tool.icon);

	return (
		<Card className="group transition-all hover:border-primary/50 hover:shadow-md">
			<CardHeader>
				<div className="mb-2 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<Icon className="size-6" />
				</div>
				<CardTitle className="text-lg">{tool.name}</CardTitle>
				<CardDescription>{tool.description}</CardDescription>
			</CardHeader>
			<CardContent>
				<Link href={`/app/tools/${tool.slug}`}>
					<Button className="w-full" variant="outline">
						Open Tool
					</Button>
				</Link>
			</CardContent>
		</Card>
	);
}
