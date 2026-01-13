import { Button } from "@ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
// import heroImage from "../../../../public/images/hero-image.png";
// import heroImageDark from "../../../../public/images/hero-image-dark.png";

export function Hero() {
	return (
		<div className="relative max-w-full overflow-x-hidden bg-linear-to-b from-0% from-card to-[50vh] to-background">
			<div className="absolute left-1/2 z-10 ml-[-500px] h-[500px] w-[1000px] rounded-full bg-linear-to-r from-primary to-bg opacity-20 blur-[150px]" />
			<div className="container relative z-20 pt-44 pb-12 text-center lg:pb-16">
				<h1 className="mx-auto max-w-3xl text-balance font-bold text-5xl lg:text-7xl">
					Simple, helpful software tools for modern business
				</h1>

				<p className="mx-auto mt-4 max-w-lg text-balance text-foreground/60 text-lg">
					Boost your productivity and streamline your workflows with
					our Software Multitools. Let us know what is missing and we
					will build it. Simple as that.
				</p>

				<div className="mt-6 flex flex-col items-center justify-center gap-3 md:flex-row">
					<Button size="lg" variant="primary" asChild>
						<Link href="/auth/login">
							Get started
							<ArrowRightIcon className="ml-2 size-4" />
						</Link>
					</Button>
					<Button variant="light" size="lg" asChild>
						<Link href="/docs">Documentation</Link>
					</Button>
				</div>

				{/* <div className="mx-auto mt-16 max-w-5xl rounded-2xl border bg-card/50 p-2 shadow-lg dark:shadow-foreground/10">
					<Image
						src={heroImage}
						alt="Our application"
						className="block rounded-xl dark:hidden"
						priority
					/>
					<Image
						src={heroImageDark}
						alt="Our application"
						className="hidden rounded-xl dark:block"
						priority
					/>
				</div> */}
			</div>
		</div>
	);
}
