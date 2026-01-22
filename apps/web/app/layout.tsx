import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import "./globals.css";
import "cropperjs/dist/cropper.css";
import { config } from "@repo/config";
import { cn } from "@ui/lib";
import { Montserrat } from "next/font/google";

const sansFont = Montserrat({
	weight: ["400", "500", "600", "700"],
	subsets: ["latin"],
	variable: "--font-sans",
});

export const metadata: Metadata = {
	title: {
		absolute: config.appName,
		default: config.appName,
		template: `%s | ${config.appName}`,
	},
};

export default function RootLayout({ children }: PropsWithChildren) {
	return (
		<html lang="en" suppressHydrationWarning className={sansFont.className}>
			<body
				className={cn(
					"min-h-screen bg-background text-foreground antialiased",
				)}
			>
				{children}
			</body>
		</html>
	);
}
