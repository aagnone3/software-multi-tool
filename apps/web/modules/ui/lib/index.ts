import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Color scheme for UI elements.
 */
export interface ColorScheme {
	/** Background color class (e.g., "bg-blue-100 dark:bg-blue-900/30") */
	bg: string;
	/** Text color class (e.g., "text-blue-700 dark:text-blue-300") */
	text: string;
	/** Solid bar/indicator color class (e.g., "bg-blue-500") */
	bar: string;
	/** Border color class (e.g., "border-blue-300 dark:border-blue-700") */
	border: string;
}

/**
 * Predefined color schemes for distinguishing entities (speakers, categories, etc.).
 * These colors are designed to be visually distinct and accessible.
 */
export const ENTITY_COLORS: ColorScheme[] = [
	{
		bg: "bg-blue-100 dark:bg-blue-900/30",
		text: "text-blue-700 dark:text-blue-300",
		bar: "bg-blue-500",
		border: "border-blue-300 dark:border-blue-700",
	},
	{
		bg: "bg-emerald-100 dark:bg-emerald-900/30",
		text: "text-emerald-700 dark:text-emerald-300",
		bar: "bg-emerald-500",
		border: "border-emerald-300 dark:border-emerald-700",
	},
	{
		bg: "bg-amber-100 dark:bg-amber-900/30",
		text: "text-amber-700 dark:text-amber-300",
		bar: "bg-amber-500",
		border: "border-amber-300 dark:border-amber-700",
	},
	{
		bg: "bg-purple-100 dark:bg-purple-900/30",
		text: "text-purple-700 dark:text-purple-300",
		bar: "bg-purple-500",
		border: "border-purple-300 dark:border-purple-700",
	},
	{
		bg: "bg-pink-100 dark:bg-pink-900/30",
		text: "text-pink-700 dark:text-pink-300",
		bar: "bg-pink-500",
		border: "border-pink-300 dark:border-pink-700",
	},
	{
		bg: "bg-cyan-100 dark:bg-cyan-900/30",
		text: "text-cyan-700 dark:text-cyan-300",
		bar: "bg-cyan-500",
		border: "border-cyan-300 dark:border-cyan-700",
	},
	{
		bg: "bg-orange-100 dark:bg-orange-900/30",
		text: "text-orange-700 dark:text-orange-300",
		bar: "bg-orange-500",
		border: "border-orange-300 dark:border-orange-700",
	},
	{
		bg: "bg-indigo-100 dark:bg-indigo-900/30",
		text: "text-indigo-700 dark:text-indigo-300",
		bar: "bg-indigo-500",
		border: "border-indigo-300 dark:border-indigo-700",
	},
];

/**
 * Get a color scheme for an entity based on its index.
 * Colors cycle through predefined schemes for visual distinction.
 *
 * @param index - The index of the entity (0-based)
 * @returns A color scheme with bg, text, bar, and border classes
 *
 * @example
 * const color = getEntityColor(0);
 * // { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", ... }
 */
export function getEntityColor(index: number): ColorScheme {
	return ENTITY_COLORS[index % ENTITY_COLORS.length];
}
