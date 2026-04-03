"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { CalendarClockIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const STORAGE_KEY = "tool-scheduled-runs";

interface ScheduledRun {
	id: string;
	toolSlug: string;
	toolName: string;
	scheduledAt: number; // unix ms
	note: string;
	notified: boolean;
}

function loadScheduledRuns(): ScheduledRun[] {
	if (typeof window === "undefined") {
		return [];
	}
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
	} catch {
		return [];
	}
}

function saveScheduledRuns(runs: ScheduledRun[]) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
	} catch {
		// ignore
	}
}

function formatScheduleLabel(ms: number): string {
	const now = Date.now();
	const diff = ms - now;
	if (diff <= 0) {
		return "now";
	}
	const mins = Math.round(diff / 60000);
	if (mins < 60) {
		return `in ${mins}m`;
	}
	const hrs = Math.round(diff / 3600000);
	if (hrs < 24) {
		return `in ${hrs}h`;
	}
	return `in ${Math.round(diff / 86400000)}d`;
}

interface ToolSchedulerProps {
	toolSlug: string;
	toolName: string;
	onRunTool?: () => void;
	className?: string;
}

export function ToolScheduler({
	toolSlug,
	toolName,
	onRunTool,
	className,
}: ToolSchedulerProps) {
	const { track } = useProductAnalytics();
	const [open, setOpen] = useState(false);
	const [offset, setOffset] = useState("15");
	const [unit, setUnit] = useState<"minutes" | "hours">("minutes");
	const [note, setNote] = useState("");
	const [scheduled, setScheduled] = useState<ScheduledRun[]>([]);

	useEffect(() => {
		setScheduled(loadScheduledRuns());
	}, [open]);

	// Poll for due scheduled runs
	useEffect(() => {
		const interval = setInterval(() => {
			const runs = loadScheduledRuns();
			const now = Date.now();
			let changed = false;
			for (const run of runs) {
				if (!run.notified && run.scheduledAt <= now) {
					run.notified = true;
					changed = true;
					toast(`⏰ Scheduled run for ${run.toolName} is due!`, {
						description: run.note || "Open the tool to run it now.",
						action: {
							label: "Open Tool",
							onClick: () => {
								if (onRunTool && run.toolSlug === toolSlug) {
									onRunTool();
								} else {
									window.location.href = `/app/tools/${run.toolSlug}`;
								}
							},
						},
						duration: 12000,
					});
				}
			}
			if (changed) {
				saveScheduledRuns(runs);
				setScheduled([...runs]);
			}
		}, 30000); // check every 30 seconds
		return () => clearInterval(interval);
	}, [toolSlug, onRunTool]);

	function handleSchedule() {
		const offsetNum = Number.parseInt(offset, 10);
		if (!offsetNum || offsetNum <= 0) {
			toast.error("Please enter a valid time offset");
			return;
		}
		const ms = unit === "minutes" ? offsetNum * 60000 : offsetNum * 3600000;
		const run: ScheduledRun = {
			id: `${toolSlug}-${Date.now()}`,
			toolSlug,
			toolName,
			scheduledAt: Date.now() + ms,
			note,
			notified: false,
		};
		const updated = [...loadScheduledRuns(), run];
		saveScheduledRuns(updated);
		setScheduled(updated);
		setOpen(false);
		setNote("");
		track({
			name: "tool_schedule_set",
			props: { tool_slug: toolSlug, offset_value: offsetNum, unit },
		});
		toast.success(`Reminder set for ${toolName}`, {
			description: `You'll be notified ${formatScheduleLabel(run.scheduledAt)}.`,
		});
	}

	function handleRemove(id: string) {
		const updated = loadScheduledRuns().filter((r) => r.id !== id);
		saveScheduledRuns(updated);
		setScheduled(updated);
		track({
			name: "tool_schedule_removed",
			props: { tool_slug: toolSlug },
		});
	}

	const toolScheduled = scheduled.filter(
		(r) => r.toolSlug === toolSlug && !r.notified,
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm" className={className}>
					<CalendarClockIcon className="size-4 mr-1.5" />
					{toolScheduled.length > 0
						? `Scheduled (${toolScheduled.length})`
						: "Schedule"}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Schedule a reminder</DialogTitle>
					<DialogDescription>
						Get a notification when it's time to run {toolName}.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="flex gap-2 items-end">
						<div className="flex-1">
							<Label htmlFor="offset">Remind me in</Label>
							<Input
								id="offset"
								type="number"
								min={1}
								value={offset}
								onChange={(e) => setOffset(e.target.value)}
								className="mt-1.5"
							/>
						</div>
						<Select
							value={unit}
							onValueChange={(v) =>
								setUnit(v as "minutes" | "hours")
							}
						>
							<SelectTrigger
								className="w-32"
								aria-label="Time unit"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="minutes">minutes</SelectItem>
								<SelectItem value="hours">hours</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label htmlFor="note">Note (optional)</Label>
						<Input
							id="note"
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder="What do you want to do?"
							className="mt-1.5"
						/>
					</div>

					{toolScheduled.length > 0 && (
						<div>
							<p className="text-sm font-medium mb-2">
								Upcoming reminders
							</p>
							<div className="space-y-2">
								{toolScheduled.map((run) => (
									<div
										key={run.id}
										className="flex items-center justify-between text-sm bg-muted/50 rounded-md px-3 py-2"
									>
										<div>
											<span className="font-medium">
												{formatScheduleLabel(
													run.scheduledAt,
												)}
											</span>
											{run.note && (
												<span className="text-muted-foreground ml-2">
													— {run.note}
												</span>
											)}
										</div>
										<Button
											variant="ghost"
											size="sm"
											className="h-6 px-2 text-muted-foreground hover:text-destructive"
											onClick={() => handleRemove(run.id)}
										>
											Remove
										</Button>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					<Button onClick={handleSchedule}>Set reminder</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
