"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/form";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Textarea } from "@ui/components/textarea";
import { cn } from "@ui/lib";
import {
	CalendarCheckIcon,
	CalendarIcon,
	CheckCircle2Icon,
	CircleDotIcon,
	ClipboardListIcon,
	ClockIcon,
	CopyIcon,
	GavelIcon,
	HelpCircleIcon,
	MessageSquareIcon,
	SparklesIcon,
	UsersIcon,
	VideoIcon,
} from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateJob } from "../hooks/use-job-polling";
import { JobProgressIndicator } from "./JobProgressIndicator";

// Metrics overview card
function MetricCard({
	icon: Icon,
	label,
	value,
	color,
}: {
	icon: React.ElementType;
	label: string;
	value: number | string;
	color: string;
}) {
	return (
		<div className="flex items-center gap-3 rounded-xl bg-muted/30 p-4">
			<div
				className={cn(
					"flex size-10 items-center justify-center rounded-lg",
					color,
				)}
			>
				<Icon className="size-5" />
			</div>
			<div>
				<p className="font-bold text-xl">{value}</p>
				<p className="text-muted-foreground text-xs">{label}</p>
			</div>
		</div>
	);
}

// Priority badge with enhanced styling
function PriorityBadge({ priority }: { priority: string }) {
	const config = {
		low: {
			bg: "bg-slate-100 dark:bg-slate-900/30",
			text: "text-slate-700 dark:text-slate-400",
			dot: "bg-slate-500",
		},
		medium: {
			bg: "bg-blue-100 dark:bg-blue-900/30",
			text: "text-blue-700 dark:text-blue-400",
			dot: "bg-blue-500",
		},
		high: {
			bg: "bg-orange-100 dark:bg-orange-900/30",
			text: "text-orange-700 dark:text-orange-400",
			dot: "bg-orange-500",
		},
		urgent: {
			bg: "bg-red-100 dark:bg-red-900/30",
			text: "text-red-700 dark:text-red-400",
			dot: "bg-red-500",
		},
	}[priority] ?? {
		bg: "bg-slate-100 dark:bg-slate-900/30",
		text: "text-slate-700 dark:text-slate-400",
		dot: "bg-slate-500",
	};

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium text-xs",
				config.bg,
				config.text,
			)}
		>
			<span className={cn("size-1.5 rounded-full", config.dot)} />
			{priority.toUpperCase()}
		</span>
	);
}

const formSchema = z.object({
	meetingNotes: z.string().min(1, "Meeting notes are required"),
	meetingType: z.enum([
		"standup",
		"planning",
		"retrospective",
		"one_on_one",
		"client",
		"general",
	]),
	participants: z.string().optional(),
	meetingDate: z.string().optional(),
	projectContext: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ActionItem {
	id: string;
	task: string;
	assignee: string | null;
	dueDate: string | null;
	priority: "low" | "medium" | "high" | "urgent";
	status: "pending" | "in_progress" | "completed" | "blocked";
	context: string | null;
	dependencies: string[];
}

interface Decision {
	decision: string;
	rationale: string | null;
	madeBy: string | null;
	impactAreas: string[];
	followUpRequired: boolean;
}

interface DiscussionTopic {
	topic: string;
	summary: string;
	keyPoints: string[];
	participants: string[];
	outcome: string | null;
	openQuestions: string[];
}

interface MeetingOutput {
	summary: {
		title: string;
		date: string | null;
		duration: string | null;
		attendees: string[];
		overview: string;
	};
	executiveSummary: string;
	topics: DiscussionTopic[];
	actionItems: ActionItem[];
	decisions: Decision[];
	keyTakeaways: string[];
	followUpMeeting: {
		recommended: boolean;
		suggestedAgenda: string[];
		suggestedDate: string | null;
	};
	blockers: Array<{
		blocker: string;
		owner: string | null;
		suggestedResolution: string | null;
	}>;
	metrics: {
		actionItemCount: number;
		decisionsCount: number;
		openQuestionsCount: number;
		participantEngagement: Array<{
			participant: string;
			contributionLevel: "low" | "medium" | "high";
			actionItemsAssigned: number;
		}>;
	};
	exportFormats: {
		markdown: string;
		plainText: string;
		jiraReady: boolean;
		slackFormatted: string;
	};
}

const _priorityColors = {
	low: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
	medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
	urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const _meetingTypeLabels = {
	standup: "Daily Standup",
	planning: "Planning",
	retrospective: "Retrospective",
	one_on_one: "1:1 Meeting",
	client: "Client Meeting",
	general: "General",
};

export function MeetingSummarizerTool() {
	const [jobId, setJobId] = useState<string | null>(null);
	const [result, setResult] = useState<MeetingOutput | null>(null);
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const createJobMutation = useCreateJob();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			meetingNotes: "",
			meetingType: "general",
			participants: "",
			meetingDate: "",
			projectContext: "",
		},
	});

	const onSubmit = async (values: FormValues) => {
		setResult(null);
		const participants = values.participants
			? values.participants.split(",").map((p) => p.trim())
			: undefined;

		try {
			const response = await createJobMutation.mutateAsync({
				toolSlug: "meeting-summarizer",
				input: {
					...values,
					participants,
				},
			});
			setJobId(response.job.id);
		} catch (error) {
			console.error("Failed to create job:", error);
		}
	};

	const handleComplete = (output: Record<string, unknown>) => {
		setResult(output as unknown as MeetingOutput);
	};

	const handleNewMeeting = () => {
		setJobId(null);
		setResult(null);
		form.reset();
	};

	const copyToClipboard = async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (error) {
			console.error("Failed to copy:", error);
		}
	};

	return (
		<div className="space-y-6">
			{!jobId && (
				<Card className="overflow-hidden border-0 shadow-lg">
					<div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent p-6 pb-0">
						<div className="flex items-start gap-4">
							<div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/25">
								<VideoIcon className="size-7 text-white" />
							</div>
							<div className="flex-1">
								<CardTitle className="text-xl">
									Meeting Summarizer
								</CardTitle>
								<CardDescription className="mt-1">
									Transform meeting notes into structured
									summaries with action items and key
									decisions
								</CardDescription>
							</div>
						</div>
					</div>
					<CardContent className="p-6">
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="space-y-6"
							>
								<FormField
									control={form.control}
									name="meetingNotes"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="font-semibold">
												Meeting Notes
											</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Paste your meeting notes, transcript, or recording summary here..."
													className="min-h-[200px] rounded-xl border-2 bg-muted/30 text-sm transition-colors focus:border-indigo-500 focus:bg-background"
													{...field}
												/>
											</FormControl>
											<FormDescription>
												Raw notes, transcript, or any
												text from your meeting
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="grid gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="meetingType"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="font-semibold">
													Meeting Type
												</FormLabel>
												<Select
													onValueChange={
														field.onChange
													}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger className="rounded-xl border-2 bg-muted/30 transition-colors focus:border-indigo-500 focus:bg-background">
															<SelectValue placeholder="Select meeting type" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="general">
															General
														</SelectItem>
														<SelectItem value="standup">
															Daily Standup
														</SelectItem>
														<SelectItem value="planning">
															Planning
														</SelectItem>
														<SelectItem value="retrospective">
															Retrospective
														</SelectItem>
														<SelectItem value="one_on_one">
															1:1 Meeting
														</SelectItem>
														<SelectItem value="client">
															Client Meeting
														</SelectItem>
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="meetingDate"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="font-semibold">
													Meeting Date (Optional)
												</FormLabel>
												<FormControl>
													<Input
														type="date"
														className="rounded-xl border-2 bg-muted/30 transition-colors focus:border-indigo-500 focus:bg-background"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="participants"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="font-semibold">
												Participants (Optional)
											</FormLabel>
											<FormControl>
												<Input
													placeholder="John, Sarah, Mike"
													className="rounded-xl border-2 bg-muted/30 transition-colors focus:border-indigo-500 focus:bg-background"
													{...field}
												/>
											</FormControl>
											<FormDescription>
												Comma-separated list of
												attendees
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="projectContext"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="font-semibold">
												Project Context (Optional)
											</FormLabel>
											<FormControl>
												<Input
													placeholder="e.g., Q4 Product Launch, Website Redesign"
													className="rounded-xl border-2 bg-muted/30 transition-colors focus:border-indigo-500 focus:bg-background"
													{...field}
												/>
											</FormControl>
											<FormDescription>
												Helps provide relevant context
												for the summary
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<Button
									type="submit"
									variant="primary"
									loading={form.formState.isSubmitting}
									className="h-12 w-full rounded-xl bg-indigo-600 font-semibold shadow-lg shadow-indigo-500/25 hover:bg-indigo-700"
								>
									Summarize Meeting
								</Button>
							</form>
						</Form>
					</CardContent>
				</Card>
			)}

			{jobId && !result && (
				<JobProgressIndicator
					jobId={jobId}
					title="Summarizing Meeting"
					description="AI is extracting key information from your meeting notes..."
					onComplete={handleComplete}
				/>
			)}

			{result && (
				<div className="space-y-6">
					{/* Meeting Header Card */}
					<Card className="overflow-hidden border-0 shadow-lg">
						<div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent p-6">
							<div className="flex items-start justify-between">
								<div className="flex items-start gap-4">
									<div className="flex size-12 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/25">
										<VideoIcon className="size-6 text-white" />
									</div>
									<div>
										<h2 className="font-bold text-xl">
											{result.summary.title}
										</h2>
										<div className="mt-2 flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
											{result.summary.date && (
												<span className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1">
													<CalendarIcon className="size-4" />
													{result.summary.date}
												</span>
											)}
											{result.summary.duration && (
												<span className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1">
													<ClockIcon className="size-4" />
													{result.summary.duration}
												</span>
											)}
										</div>
									</div>
								</div>
								<Button
									variant="outline"
									size="sm"
									className="rounded-lg"
									onClick={() =>
										copyToClipboard(
											result.exportFormats.markdown,
											"markdown",
										)
									}
								>
									<CopyIcon className="mr-2 size-4" />
									{copiedField === "markdown"
										? "Copied!"
										: "Copy Markdown"}
								</Button>
							</div>
						</div>
						<CardContent className="p-6">
							{/* Metrics Row */}
							<div className="mb-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
								<MetricCard
									icon={ClipboardListIcon}
									label="Action Items"
									value={result.metrics.actionItemCount}
									color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
								/>
								<MetricCard
									icon={GavelIcon}
									label="Decisions"
									value={result.metrics.decisionsCount}
									color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
								/>
								<MetricCard
									icon={HelpCircleIcon}
									label="Open Questions"
									value={result.metrics.openQuestionsCount}
									color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
								/>
								<MetricCard
									icon={UsersIcon}
									label="Participants"
									value={result.summary.attendees.length}
									color="bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
								/>
							</div>

							{/* Attendees */}
							{result.summary.attendees.length > 0 && (
								<div className="mb-6 flex items-center gap-3 rounded-xl bg-muted/30 p-4">
									<UsersIcon className="size-5 text-muted-foreground" />
									<div className="flex flex-wrap gap-2">
										{result.summary.attendees.map(
											(attendee, index) => (
												<span
													key={index}
													className="rounded-full bg-indigo-100 px-3 py-1 font-medium text-indigo-700 text-sm dark:bg-indigo-900/30 dark:text-indigo-400"
												>
													{attendee}
												</span>
											),
										)}
									</div>
								</div>
							)}

							{/* Executive Summary */}
							<div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-5 dark:from-indigo-900/20 dark:to-purple-900/20">
								<div className="mb-2 flex items-center gap-2">
									<SparklesIcon className="size-4 text-indigo-600" />
									<h4 className="font-semibold">
										Executive Summary
									</h4>
								</div>
								<p className="leading-relaxed text-muted-foreground">
									{result.executiveSummary}
								</p>
							</div>

							{/* Key Takeaways */}
							{result.keyTakeaways.length > 0 && (
								<div className="mt-6">
									<h4 className="mb-3 font-semibold">
										Key Takeaways
									</h4>
									<div className="grid gap-2">
										{result.keyTakeaways.map(
											(takeaway, index) => (
												<div
													key={index}
													className="flex items-start gap-3 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20"
												>
													<div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500">
														<CheckCircle2Icon className="size-3 text-white" />
													</div>
													<span className="text-sm">
														{takeaway}
													</span>
												</div>
											),
										)}
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Action Items */}
					{result.actionItems.length > 0 && (
						<Card className="overflow-hidden border-0 shadow-lg">
							<CardHeader className="border-b bg-muted/30">
								<div className="flex items-center gap-3">
									<div className="flex size-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
										<ClipboardListIcon className="size-5 text-indigo-600 dark:text-indigo-400" />
									</div>
									<CardTitle>
										Action Items (
										{result.actionItems.length})
									</CardTitle>
								</div>
							</CardHeader>
							<CardContent className="p-6">
								<div className="space-y-3">
									{result.actionItems.map((item) => (
										<div
											key={item.id}
											className="group rounded-xl border-2 border-transparent bg-muted/30 p-4 transition-all hover:border-indigo-500/30 hover:bg-muted/50"
										>
											<div className="flex items-start justify-between gap-3">
												<div className="space-y-2">
													<div className="flex flex-wrap items-center gap-2">
														<PriorityBadge
															priority={
																item.priority
															}
														/>
														{item.assignee && (
															<span className="rounded-full bg-background px-2.5 py-1 font-medium text-xs shadow-sm">
																@{item.assignee}
															</span>
														)}
													</div>
													<p className="font-medium">
														{item.task}
													</p>
												</div>
												{item.dueDate && (
													<span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-background px-3 py-1.5 text-muted-foreground text-sm shadow-sm">
														<CalendarIcon className="size-3.5" />
														{item.dueDate}
													</span>
												)}
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Decisions */}
					{result.decisions.length > 0 && (
						<Card className="overflow-hidden border-0 shadow-lg">
							<CardHeader className="border-b bg-muted/30">
								<div className="flex items-center gap-3">
									<div className="flex size-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
										<GavelIcon className="size-5 text-purple-600 dark:text-purple-400" />
									</div>
									<CardTitle>
										Decisions Made (
										{result.decisions.length})
									</CardTitle>
								</div>
							</CardHeader>
							<CardContent className="p-6">
								<div className="space-y-4">
									{result.decisions.map((decision, index) => (
										<div
											key={index}
											className="rounded-xl border-l-4 border-l-purple-500 bg-muted/30 p-4"
										>
											<p className="font-semibold">
												{decision.decision}
											</p>
											{decision.rationale && (
												<p className="mt-2 text-muted-foreground text-sm">
													{decision.rationale}
												</p>
											)}
											<div className="mt-3 flex flex-wrap items-center gap-3">
												{decision.madeBy && (
													<span className="rounded-full bg-background px-3 py-1 text-sm shadow-sm">
														<span className="text-muted-foreground">
															by{" "}
														</span>
														<span className="font-medium">
															{decision.madeBy}
														</span>
													</span>
												)}
												{decision.followUpRequired && (
													<span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700 text-xs dark:bg-amber-900/30 dark:text-amber-400">
														<CircleDotIcon className="size-3" />
														Follow-up Required
													</span>
												)}
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Discussion Topics */}
					{result.topics.length > 0 && (
						<Card className="overflow-hidden border-0 shadow-lg">
							<CardHeader className="border-b bg-muted/30">
								<div className="flex items-center gap-3">
									<div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
										<MessageSquareIcon className="size-5 text-blue-600 dark:text-blue-400" />
									</div>
									<CardTitle>Discussion Topics</CardTitle>
								</div>
							</CardHeader>
							<CardContent className="p-6">
								<div className="space-y-4">
									{result.topics.map((topic, index) => (
										<div
											key={index}
											className="rounded-xl bg-muted/30 p-5"
										>
											<h4 className="font-semibold text-lg">
												{topic.topic}
											</h4>
											<p className="mt-2 text-muted-foreground text-sm">
												{topic.summary}
											</p>
											{topic.keyPoints.length > 0 && (
												<ul className="mt-4 space-y-2">
													{topic.keyPoints.map(
														(point, i) => (
															<li
																key={i}
																className="flex items-start gap-2 text-sm"
															>
																<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-indigo-500" />
																{point}
															</li>
														),
													)}
												</ul>
											)}
											{topic.openQuestions.length > 0 && (
												<div className="mt-4 rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
													<div className="mb-2 flex items-center gap-2">
														<HelpCircleIcon className="size-4 text-amber-600" />
														<p className="font-semibold text-sm">
															Open Questions
														</p>
													</div>
													<ul className="space-y-2">
														{topic.openQuestions.map(
															(q, i) => (
																<li
																	key={i}
																	className="flex items-start gap-2 text-sm"
																>
																	<span className="text-amber-600">
																		•
																	</span>
																	{q}
																</li>
															),
														)}
													</ul>
												</div>
											)}
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Follow-up Meeting */}
					{result.followUpMeeting.recommended && (
						<Card className="overflow-hidden border-0 border-l-4 border-l-indigo-500 shadow-lg">
							<CardHeader className="bg-indigo-50/50 dark:bg-indigo-900/10">
								<div className="flex items-center gap-3">
									<div className="flex size-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
										<CalendarCheckIcon className="size-5 text-indigo-600 dark:text-indigo-400" />
									</div>
									<CardTitle>
										Follow-up Meeting Recommended
									</CardTitle>
								</div>
							</CardHeader>
							<CardContent className="p-6">
								{result.followUpMeeting.suggestedDate && (
									<p className="mb-4 flex items-center gap-2 text-muted-foreground text-sm">
										<ClockIcon className="size-4" />
										Suggested date:{" "}
										<span className="font-medium text-foreground">
											{
												result.followUpMeeting
													.suggestedDate
											}
										</span>
									</p>
								)}
								{result.followUpMeeting.suggestedAgenda.length >
									0 && (
									<div>
										<h4 className="mb-3 font-semibold">
											Suggested Agenda
										</h4>
										<ol className="space-y-2">
											{result.followUpMeeting.suggestedAgenda.map(
												(item, index) => (
													<li
														key={index}
														className="flex items-start gap-3 rounded-lg bg-muted/30 p-3 text-sm"
													>
														<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-200 font-semibold text-indigo-700 text-xs dark:bg-indigo-800 dark:text-indigo-300">
															{index + 1}
														</span>
														{item}
													</li>
												),
											)}
										</ol>
									</div>
								)}
							</CardContent>
						</Card>
					)}

					<Button
						onClick={handleNewMeeting}
						variant="outline"
						className="rounded-xl"
					>
						Summarize Another Meeting
					</Button>
				</div>
			)}
		</div>
	);
}
