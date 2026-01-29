"use client";

import type { Row, Table } from "@tanstack/react-table";
import { cn } from "@ui/lib";
import { CheckIcon, MinusIcon } from "lucide-react";
import { useEffect, useRef } from "react";

interface CheckboxProps {
	checked: boolean | "indeterminate";
	onCheckedChange: (checked: boolean) => void;
	ariaLabel?: string;
}

function Checkbox({ checked, onCheckedChange, ariaLabel }: CheckboxProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const isIndeterminate = checked === "indeterminate";
	const isChecked = checked === true;

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.indeterminate = isIndeterminate;
		}
	}, [isIndeterminate]);

	return (
		<label
			className={cn(
				"relative inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-primary ring-offset-background",
				"focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
				(isChecked || isIndeterminate) &&
					"bg-primary text-primary-foreground",
			)}
		>
			<input
				ref={inputRef}
				type="checkbox"
				checked={isChecked}
				onChange={(e) => onCheckedChange(e.target.checked)}
				aria-label={ariaLabel}
				className="sr-only"
			/>
			{isChecked && <CheckIcon className="size-3" />}
			{isIndeterminate && <MinusIcon className="size-3" />}
		</label>
	);
}

export interface DataTableSelectAllProps<TData> {
	table: Table<TData>;
}

export function DataTableSelectAll<TData>({
	table,
}: DataTableSelectAllProps<TData>) {
	const isAllSelected = table.getIsAllPageRowsSelected();
	const isSomeSelected = table.getIsSomePageRowsSelected();

	return (
		<Checkbox
			checked={
				isAllSelected ? true : isSomeSelected ? "indeterminate" : false
			}
			onCheckedChange={(checked) =>
				table.toggleAllPageRowsSelected(checked)
			}
			ariaLabel="Select all rows"
		/>
	);
}

export interface DataTableSelectRowProps<TData> {
	row: Row<TData>;
}

export function DataTableSelectRow<TData>({
	row,
}: DataTableSelectRowProps<TData>) {
	return (
		<Checkbox
			checked={row.getIsSelected()}
			onCheckedChange={(checked) => row.toggleSelected(checked)}
			ariaLabel="Select row"
		/>
	);
}
