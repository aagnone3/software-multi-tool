import { config } from "@repo/config";
import { Logo } from "@shared/components/Logo";
import Link from "next/link";

export function Footer() {
	return (
		<footer className="border-t py-8 text-foreground/60 text-sm">
			<div className="container grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div>
					<Logo className="opacity-70 grayscale" />
					<p className="mt-3 text-sm opacity-70">
						© {new Date().getFullYear()} {config.appName}.{" "}
						<a href="https://github.com/aagnone3/software-multi-tool">
							Built by Life With Data.
						</a>
					</p>
				</div>

				<div className="flex flex-col gap-2">
					{config.ui.blog.enabled && (
						<Link href="/blog" className="block">
							Blog
						</Link>
					)}

					<a href="#features" className="block">
						Features
					</a>

					<a href="/#pricing" className="block">
						Pricing
					</a>
				</div>

				<div className="flex flex-col gap-2">
					<Link href="/legal/privacy-policy" className="block">
						Privacy policy
					</Link>

					<Link href="/legal/terms" className="block">
						Terms and conditions
					</Link>
				</div>
			</div>
		</footer>
	);
}
