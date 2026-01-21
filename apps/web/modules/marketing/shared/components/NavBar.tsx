"use client";

import { config } from "@repo/config";
import { useSession } from "@saas/auth/hooks/use-session";
import { ColorModeToggle } from "@shared/components/ColorModeToggle";
import { Logo } from "@shared/components/Logo";
import { Button } from "@ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "@ui/components/sheet";
import { cn } from "@ui/lib";
import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";

export function NavBar() {
	const { user } = useSession();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const pathname = usePathname();
	const [isTop, setIsTop] = useState(true);

	const debouncedScrollHandler = useDebounceCallback(
		() => {
			setIsTop(window.scrollY <= 10);
		},
		150,
		{
			maxWait: 150,
		},
	);

	useEffect(() => {
		window.addEventListener("scroll", debouncedScrollHandler);
		debouncedScrollHandler();
		return () => {
			window.removeEventListener("scroll", debouncedScrollHandler);
		};
	}, [debouncedScrollHandler]);

	useEffect(() => {
		setMobileMenuOpen(false);
	}, [pathname]);

	const isDocsPage = pathname.startsWith("/docs");

	const menuItems: {
		label: string;
		href: string;
	}[] = [
		{
			label: "Pricing",
			href: "/#pricing",
		},
		{
			label: "FAQ",
			href: "/#faq",
		},
		...(config.ui.blog.enabled
			? [
					{
						label: "Blog",
						href: "/blog",
					},
				]
			: []),
		...(config.contactForm.enabled
			? [
					{
						label: "Contact",
						href: "/contact",
					},
				]
			: []),
		{
			label: "Docs",
			href: "/docs",
		},
	];

	const isMenuItemActive = (href: string) => pathname.startsWith(href);

	return (
		<nav
			className={cn(
				"fixed top-0 left-0 z-50 w-full transition-shadow duration-200",
				!isTop || isDocsPage
					? "bg-card/80 shadow-sm backdrop-blur-lg"
					: "shadow-none",
			)}
			data-test="navigation"
		>
			<div className="container">
				<div
					className={cn(
						"flex items-center justify-stretch gap-6 transition-[padding] duration-200",
						!isTop || isDocsPage ? "py-4" : "py-6",
					)}
				>
					<div className="flex flex-1 justify-start">
						<Link
							href="/"
							className="block hover:no-underline active:no-underline"
						>
							<Logo />
						</Link>
					</div>

					<div className="hidden flex-1 items-center justify-center lg:flex">
						{menuItems.map((menuItem) => (
							<Link
								key={menuItem.href}
								href={menuItem.href}
								className={cn(
									"block px-3 py-2 font-medium text-foreground/80 text-sm",
									isMenuItemActive(menuItem.href)
										? "font-bold text-foreground"
										: "",
								)}
								prefetch
							>
								{menuItem.label}
							</Link>
						))}
					</div>

					<div className="flex flex-1 items-center justify-end gap-3">
						<ColorModeToggle />

						<Sheet
							open={mobileMenuOpen}
							onOpenChange={(open) => setMobileMenuOpen(open)}
						>
							<SheetTrigger asChild>
								<Button
									className="lg:hidden"
									size="icon"
									variant="light"
									aria-label="Menu"
								>
									<MenuIcon className="size-4" />
								</Button>
							</SheetTrigger>
							<SheetContent className="w-[280px]" side="right">
								<SheetTitle />
								<div className="flex flex-col items-start justify-center">
									{menuItems.map((menuItem) => (
										<Link
											key={menuItem.href}
											href={menuItem.href}
											className={cn(
												"block px-3 py-2 font-medium text-base text-foreground/80",
												isMenuItemActive(menuItem.href)
													? "font-bold text-foreground"
													: "",
											)}
											prefetch
										>
											{menuItem.label}
										</Link>
									))}

									<Link
										key={user ? "start" : "login"}
										href={user ? "/app" : "/auth/login"}
										className="block px-3 py-2 text-base"
										prefetch={!user}
									>
										{user ? "Dashboard" : "Login"}
									</Link>
								</div>
							</SheetContent>
						</Sheet>

						{config.ui.saas.enabled &&
							(user ? (
								<Button
									key="dashboard"
									className="hidden lg:flex"
									asChild
									variant="secondary"
								>
									<Link href="/app">Dashboard</Link>
								</Button>
							) : (
								<Button
									key="login"
									className="hidden lg:flex"
									asChild
									variant="secondary"
								>
									<Link href="/auth/login" prefetch>
										Login
									</Link>
								</Button>
							))}
					</div>
				</div>
			</div>
		</nav>
	);
}
