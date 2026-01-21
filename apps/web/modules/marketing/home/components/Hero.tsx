import { Button } from "@ui/components/button";
import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";

export function Hero() {
	return (
		<section className="relative max-w-full overflow-x-hidden bg-linear-to-b from-0% from-card to-[50vh] to-background">
			<div className="absolute left-1/2 z-10 ml-[-500px] h-[500px] w-[1000px] rounded-full bg-linear-to-r from-primary/30 to-highlight/20 opacity-30 blur-[150px]" />
			<div className="container relative z-20 pt-32 pb-16 text-center md:pt-40 lg:pt-48 lg:pb-24">
				<div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
					<SparklesIcon className="size-4" />
					<span>AI-powered tools for small businesses</span>
				</div>

				<h1 className="mx-auto max-w-4xl text-balance font-bold text-4xl leading-tight md:text-5xl lg:text-6xl">
					Your one-stop shop for{" "}
					<span className="text-primary">AI-powered</span> business
					tools
				</h1>

				<p className="mx-auto mt-6 max-w-2xl text-balance text-foreground/70 text-lg md:text-xl">
					Access powerful AI capabilities without technical
					complexity. Summarize documents, process audio, automate
					tasks, and boost productivity — all in one intuitive
					platform.
				</p>

				<div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
					<Button size="lg" variant="primary" asChild>
						<Link href="/auth/signup">
							Get Started Free
							<ArrowRightIcon className="ml-2 size-4" />
						</Link>
					</Button>
					<Button variant="outline" size="lg" asChild>
						<Link href="#how-it-works">See How It Works</Link>
					</Button>
				</div>

				<p className="mt-6 text-foreground/50 text-sm">
					No credit card required · Start in under 2 minutes
				</p>
			</div>
		</section>
	);
}
