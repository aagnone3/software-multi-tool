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
import { Skeleton } from "@ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { cn } from "@ui/lib";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import type { Transaction } from "../hooks/use-credits-history";
import { useCreditsHistory } from "../hooks/use-credits-history";
import { formatToolName } from "../lib/format-tool-name";

interface TransactionHistoryProps {
	className?: string;
}

const PAGE_SIZE = 20;

function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

function getTransactionBadgeStatus(
	type: Transaction["type"],
): "success" | "info" | "warning" | "error" {
	switch (type) {
		case "GRANT":
		case "PURCHASE":
			return "success";
		case "USAGE":
			return "info";
		case "OVERAGE":
			return "warning";
		case "REFUND":
			return "info";
		case "ADJUSTMENT":
			return "info";
		default:
			return "info";
	}
}

export function TransactionHistory({ className }: TransactionHistoryProps) {
	const [page, setPage] = useState(0);

	const { transactions, pagination, isLoading } = useCreditsHistory({
		limit: PAGE_SIZE,
		offset: page * PAGE_SIZE,
	});

	if (isLoading) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle>Transaction History</CardTitle>
					<CardDescription>All credit transactions</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						{Array.from({ length: 5 }).map((_, i) => (
							<Skeleton
								key={`skeleton-row-${i}`}
								className="h-12 w-full"
							/>
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	const hasTransactions = transactions.length > 0;
	const startIndex = page * PAGE_SIZE + 1;
	const endIndex = Math.min((page + 1) * PAGE_SIZE, pagination?.total ?? 0);

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>Transaction History</CardTitle>
				<CardDescription>All credit transactions</CardDescription>
			</CardHeader>
			<CardContent>
				{hasTransactions ? (
					<>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Date</TableHead>
									<TableHead>Tool</TableHead>
									<TableHead>Type</TableHead>
									<TableHead className="text-right">
										Credits
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{transactions.map((tx) => (
									<TableRow key={tx.id}>
										<TableCell className="text-muted-foreground">
											{formatDate(tx.createdAt)}
										</TableCell>
										<TableCell>
											{formatToolName(tx.toolSlug)}
										</TableCell>
										<TableCell>
											<Badge
												status={getTransactionBadgeStatus(
													tx.type,
												)}
											>
												{tx.type}
											</Badge>
										</TableCell>
										<TableCell className="text-right font-mono">
											<span
												className={cn(
													tx.amount > 0
														? "text-emerald-600 dark:text-emerald-400"
														: "text-foreground",
												)}
											>
												{tx.amount > 0 ? "+" : ""}
												{tx.amount}
											</span>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>

						<div className="flex items-center justify-between mt-4">
							<p className="text-sm text-muted-foreground">
								Showing {startIndex}-{endIndex} of{" "}
								{pagination?.total ?? 0}
							</p>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={page === 0}
									onClick={() => setPage((p) => p - 1)}
								>
									<ChevronLeftIcon className="size-4 mr-1" />
									Previous
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={!pagination?.hasMore}
									onClick={() => setPage((p) => p + 1)}
								>
									Next
									<ChevronRightIcon className="size-4 ml-1" />
								</Button>
							</div>
						</div>
					</>
				) : (
					<div
						className={cn(
							"flex h-32 items-center justify-center",
							"text-sm text-muted-foreground",
						)}
					>
						No transactions found
					</div>
				)}
			</CardContent>
		</Card>
	);
}
