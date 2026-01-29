"use client";

import type { Column } from "@tanstack/react-table";
import { Button } from "@ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { cn } from "@ui/lib";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	ChevronsUpDownIcon,
	EyeOffIcon,
} from "lucide-react";

export interface DataTableColumnHeaderProps<TData, TValue> {
	column: Column<TData, TValue>;
	title: string;
	className?: string;
}

export function DataTableColumnHeader<TData, TValue>({
	column,
	title,
	className,
}: DataTableColumnHeaderProps<TData, TValue>) {
	if (!column.getCanSort() && !column.getCanHide()) {
		return <div className={cn(className)}>{title}</div>;
	}

	const isSorted = column.getIsSorted();

	return (
		<div className={cn("flex items-center space-x-2", className)}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="-ml-3 h-8 data-[state=open]:bg-accent"
					>
						<span>{title}</span>
						{column.getCanSort() &&
							(isSorted === "desc" ? (
								<ArrowDownIcon className="ml-2 size-4" />
							) : isSorted === "asc" ? (
								<ArrowUpIcon className="ml-2 size-4" />
							) : (
								<ChevronsUpDownIcon className="ml-2 size-4" />
							))}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					{column.getCanSort() && (
						<>
							<DropdownMenuItem
								onClick={() => column.toggleSorting(false)}
							>
								<ArrowUpIcon className="mr-2 size-3.5 text-muted-foreground/70" />
								Asc
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => column.toggleSorting(true)}
							>
								<ArrowDownIcon className="mr-2 size-3.5 text-muted-foreground/70" />
								Desc
							</DropdownMenuItem>
						</>
					)}
					{column.getCanSort() && column.getCanHide() && (
						<DropdownMenuSeparator />
					)}
					{column.getCanHide() && (
						<DropdownMenuItem
							onClick={() => column.toggleVisibility(false)}
						>
							<EyeOffIcon className="mr-2 size-3.5 text-muted-foreground/70" />
							Hide
						</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
