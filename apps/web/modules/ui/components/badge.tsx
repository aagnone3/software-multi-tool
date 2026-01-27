import { cn } from "@ui/lib";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import * as React from "react";

export const badge = cva(
	[
		"inline-flex",
		"items-center",
		"rounded-full",
		"px-3",
		"py-1",
		"text-xs",
		"font-semibold",
		"leading-tight",
	],
	{
		variants: {
			status: {
				success: ["bg-success/10", "text-success"],
				info: ["bg-primary/10", "text-primary"],
				warning: ["bg-highlight/10", "text-highlight"],
				error: ["bg-destructive/10", "text-destructive"],
			},
		},
		defaultVariants: {
			status: "info",
		},
	},
);

export type BadgeProps = React.HtmlHTMLAttributes<HTMLDivElement> &
	VariantProps<typeof badge>;

export const Badge = ({
	children,
	className,
	status,
	...props
}: BadgeProps) => (
	<span className={cn(badge({ status }), className)} {...props}>
		{children}
	</span>
);

Badge.displayName = "Badge";
