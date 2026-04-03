"use client";

import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { CheckIcon, CoinsIcon, XIcon } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useTools } from "../hooks/use-tools";

interface CompareRowProps {
	label: string;
	leftValue: React.ReactNode;
	rightValue: React.ReactNode;
	highlight?: boolean;
}

function CompareRow({
	label,
	leftValue,
	rightValue,
	highlight,
}: CompareRowProps) {
	return (
		<div
			className={`grid grid-cols-3 gap-4 py-3 border-b last:border-b-0 ${highlight ? "bg-muted/30 rounded" : ""}`}
		>
			<div className="text-sm font-medium text-muted-foreground px-2">
				{label}
			</div>
			<div className="text-sm text-center">{leftValue}</div>
			<div className="text-sm text-center">{rightValue}</div>
		</div>
	);
}

export function ToolCompareView() {
	const { enabledTools } = useTools();
	const [leftSlug, setLeftSlug] = useState<string>(
		enabledTools[0]?.slug ?? "",
	);
	const [rightSlug, setRightSlug] = useState<string>(
		enabledTools[1]?.slug ?? "",
	);

	const leftTool = enabledTools.find((t) => t.slug === leftSlug);
	const rightTool = enabledTools.find((t) => t.slug === rightSlug);
	const isSameTool = leftSlug === rightSlug && leftSlug !== "";

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-3 gap-4 items-end">
				<div />
				<div className="space-y-2">
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">
						Tool A
					</p>
					<Select value={leftSlug} onValueChange={setLeftSlug}>
						<SelectTrigger aria-label="Select Tool A for comparison">
							<SelectValue placeholder="Select a tool" />
						</SelectTrigger>
						<SelectContent>
							{enabledTools.map((tool) => (
								<SelectItem key={tool.slug} value={tool.slug}>
									{tool.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">
						Tool B
					</p>
					<Select value={rightSlug} onValueChange={setRightSlug}>
						<SelectTrigger aria-label="Select Tool B for comparison">
							<SelectValue placeholder="Select a tool" />
						</SelectTrigger>
						<SelectContent>
							{enabledTools.map((tool) => (
								<SelectItem key={tool.slug} value={tool.slug}>
									{tool.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{isSameTool && (
				<p className="text-sm text-muted-foreground text-center">
					Select two different tools to compare them.
				</p>
			)}

			{leftTool && rightTool && !isSameTool && (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Comparison</CardTitle>
						<CardDescription>
							Side-by-side feature comparison
						</CardDescription>
					</CardHeader>
					<CardContent
						role="table"
						aria-label="Tool comparison table"
						className="space-y-1"
					>
						<CompareRow
							label="Name"
							leftValue={
								<span className="font-medium">
									{leftTool.name}
								</span>
							}
							rightValue={
								<span className="font-medium">
									{rightTool.name}
								</span>
							}
						/>
						<CompareRow
							label="Description"
							leftValue={
								<span className="text-muted-foreground text-xs leading-snug">
									{leftTool.description}
								</span>
							}
							rightValue={
								<span className="text-muted-foreground text-xs leading-snug">
									{rightTool.description}
								</span>
							}
						/>
						<CompareRow
							label="Credit Cost"
							highlight={
								leftTool.creditCost !== rightTool.creditCost
							}
							leftValue={
								<div className="flex items-center justify-center gap-1">
									<CoinsIcon className="size-3 text-amber-500" />
									<span
										className={
											leftTool.creditCost <
											rightTool.creditCost
												? "text-green-600 font-semibold"
												: ""
										}
									>
										{leftTool.creditCost}
									</span>
								</div>
							}
							rightValue={
								<div className="flex items-center justify-center gap-1">
									<CoinsIcon className="size-3 text-amber-500" />
									<span
										className={
											rightTool.creditCost <
											leftTool.creditCost
												? "text-green-600 font-semibold"
												: ""
										}
									>
										{rightTool.creditCost}
									</span>
								</div>
							}
						/>
						<CompareRow
							label="Public (No Login)"
							leftValue={
								leftTool.public ? (
									<CheckIcon className="size-4 text-green-500 mx-auto" />
								) : (
									<XIcon className="size-4 text-muted-foreground mx-auto" />
								)
							}
							rightValue={
								rightTool.public ? (
									<CheckIcon className="size-4 text-green-500 mx-auto" />
								) : (
									<XIcon className="size-4 text-muted-foreground mx-auto" />
								)
							}
						/>
						<CompareRow
							label="Status"
							leftValue={
								<Badge status="success" className="text-xs">
									Active
								</Badge>
							}
							rightValue={
								<Badge status="success" className="text-xs">
									Active
								</Badge>
							}
						/>
						<div className="grid grid-cols-3 gap-4 pt-4">
							<div />
							<div className="flex justify-center">
								<Button asChild size="sm">
									<Link href={`/app/tools/${leftTool.slug}`}>
										Open {leftTool.name}
									</Link>
								</Button>
							</div>
							<div className="flex justify-center">
								<Button asChild size="sm">
									<Link href={`/app/tools/${rightTool.slug}`}>
										Open {rightTool.name}
									</Link>
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
