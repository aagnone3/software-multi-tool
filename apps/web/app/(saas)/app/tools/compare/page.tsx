import { ToolCompareView } from "@saas/tools/components/ToolCompareView";

export default function ToolComparePage() {
	return (
		<div className="container max-w-4xl py-8 space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Compare Tools</h1>
				<p className="text-muted-foreground mt-1">
					Side-by-side comparison to help you choose the right tool
					for your needs.
				</p>
			</div>
			<ToolCompareView />
		</div>
	);
}
