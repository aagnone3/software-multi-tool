import { cn } from "@ui/lib";
import type { LucideIcon, LucideProps } from "lucide-react";
import * as React from "react";

/**
 * Icon Size System
 *
 * Standardized icon sizes for consistent UI across the application.
 * These sizes are designed to work harmoniously with text and spacing.
 *
 * | Size | Pixels | Tailwind | Use Case |
 * |------|--------|----------|----------|
 * | xs   | 12px   | size-3   | Inline with small text, badges, chips |
 * | sm   | 16px   | size-4   | Default UI controls, buttons, navigation |
 * | md   | 20px   | size-5   | Emphasized icons, medium buttons |
 * | lg   | 24px   | size-6   | Section headers, prominent actions |
 * | xl   | 32px   | size-8   | Feature highlights, empty states |
 * | 2xl  | 40px   | size-10  | Hero icons, loading states |
 */
export type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

/**
 * Icon Color Variants
 *
 * Icons inherit color by default (currentColor), but semantic variants
 * are available for specific contexts.
 *
 * | Variant     | Use Case |
 * |-------------|----------|
 * | inherit     | Inherits from parent (default) |
 * | primary     | Brand actions, links, focus states |
 * | secondary   | Strong contrast, secondary actions |
 * | muted       | Subdued icons, placeholder states |
 * | success     | Confirmations, positive feedback |
 * | destructive | Errors, deletions, warnings |
 * | highlight   | Attention, badges, notifications |
 */
export type IconColor =
	| "inherit"
	| "primary"
	| "secondary"
	| "muted"
	| "success"
	| "destructive"
	| "highlight";

const sizeClasses: Record<IconSize, string> = {
	xs: "size-3",
	sm: "size-4",
	md: "size-5",
	lg: "size-6",
	xl: "size-8",
	"2xl": "size-10",
};

const colorClasses: Record<IconColor, string> = {
	inherit: "",
	primary: "text-primary",
	secondary: "text-secondary",
	muted: "text-muted-foreground",
	success: "text-success",
	destructive: "text-destructive",
	highlight: "text-highlight",
};

export interface IconProps extends Omit<LucideProps, "size" | "color"> {
	/**
	 * The Lucide icon component to render
	 */
	icon: LucideIcon;
	/**
	 * Icon size variant
	 * @default "sm"
	 */
	size?: IconSize;
	/**
	 * Icon color variant
	 * @default "inherit"
	 */
	color?: IconColor;
	/**
	 * Additional CSS classes
	 */
	className?: string;
}

/**
 * Icon component with standardized sizing and color system.
 *
 * @example
 * // Basic usage with size
 * <Icon icon={HomeIcon} size="md" />
 *
 * @example
 * // With semantic color
 * <Icon icon={CheckIcon} size="lg" color="success" />
 *
 * @example
 * // In a button (inherits color)
 * <Button>
 *   <Icon icon={PlusIcon} size="sm" />
 *   Add Item
 * </Button>
 */
export function Icon({
	icon: IconComponent,
	size = "sm",
	color = "inherit",
	className,
	...props
}: IconProps) {
	return (
		<IconComponent
			className={cn(
				"shrink-0",
				sizeClasses[size],
				colorClasses[color],
				className,
			)}
			aria-hidden="true"
			{...props}
		/>
	);
}

/**
 * Icon size values in pixels for programmatic use
 */
export const iconSizeValues: Record<IconSize, number> = {
	xs: 12,
	sm: 16,
	md: 20,
	lg: 24,
	xl: 32,
	"2xl": 40,
};

/**
 * Type guard to check if a value is a valid IconSize
 */
export function isIconSize(value: unknown): value is IconSize {
	return (
		typeof value === "string" &&
		["xs", "sm", "md", "lg", "xl", "2xl"].includes(value)
	);
}

/**
 * Type guard to check if a value is a valid IconColor
 */
export function isIconColor(value: unknown): value is IconColor {
	return (
		typeof value === "string" &&
		[
			"inherit",
			"primary",
			"secondary",
			"muted",
			"success",
			"destructive",
			"highlight",
		].includes(value)
	);
}
