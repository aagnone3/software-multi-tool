import { PageHeader } from "@saas/shared/components/PageHeader";
import { ToolsGrid } from "@saas/tools/components/ToolsGrid";
import { Button } from "@ui/components/button";
import { BarChart3Icon, GitCompareArrowsIcon } from "lucide-react";
import Link from "next/link";

export default function ToolsPage() {
	return (
		<div>
			<PageHeader
				title="Tools"
				subtitle="Explore our collection of AI-powered utilities"
				actions={
					<div className="flex items-center gap-2">
						<Button asChild variant="outline" size="sm">
							<Link href="/app/tools/insights">
								<BarChart3Icon className="size-4 mr-1" />
								Insights
							</Link>
						</Button>
						<Button asChild variant="outline" size="sm">
							<Link href="/app/tools/compare">
								<GitCompareArrowsIcon className="size-4 mr-1" />
								Compare Tools
							</Link>
						</Button>
					</div>
				}
			/>
			<ToolsGrid />
		</div>
	);
}
