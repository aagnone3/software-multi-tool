import { Button } from "@ui/components/button";
import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";

export function BlogCTA() {
	return (
		<div className="my-10 rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
			<SparklesIcon className="mx-auto mb-3 size-6 text-primary" />
			<h3 className="font-semibold text-lg">Ready to try it yourself?</h3>
			<p className="mx-auto mt-2 max-w-md text-foreground/60 text-sm">
				Get free credits on signup — no credit card required. Run your
				first AI tool in under a minute.
			</p>
			<div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
				<Button asChild size="sm">
					<Link href="/auth/signup">
						Get started free
						<ArrowRightIcon className="ml-1.5 size-3.5" />
					</Link>
				</Button>
				<Link
					href="/pricing"
					className="text-foreground/50 text-sm underline-offset-4 hover:text-foreground/80 hover:underline"
				>
					See pricing
				</Link>
			</div>
		</div>
	);
}
