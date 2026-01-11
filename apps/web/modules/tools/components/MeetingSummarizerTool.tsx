"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
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
	CalendarIcon,
	CheckCircle2Icon,
	ClipboardListIcon,
	ClockIcon,
	CopyIcon,
	MessageSquareIcon,
	UsersIcon,
	VideoIcon,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateJob } from "../hooks/use-job-polling";
import { JobProgressIndicator } from "./JobProgressIndicator";

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

const priorityColors = {
	low: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
	medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
	urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const meetingTypeLabels = {
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
				<Card>
					<CardHeader>
						<div className="flex items-center gap-3">
							<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
								<VideoIcon className="size-5 text-primary" />
							</div>
							<div>
								<CardTitle>Meeting Summarizer</CardTitle>
								<CardDescription>
									Transform meeting notes into structured
									summaries with action items and key
									decisions
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
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
											<FormLabel>Meeting Notes</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Paste your meeting notes, transcript, or recording summary here..."
													className="min-h-[200px] text-sm"
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
												<FormLabel>
													Meeting Type
												</FormLabel>
												<Select
													onValueChange={
														field.onChange
													}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger>
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
												<FormLabel>
													Meeting Date (Optional)
												</FormLabel>
												<FormControl>
													<Input
														type="date"
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
											<FormLabel>
												Participants (Optional)
											</FormLabel>
											<FormControl>
												<Input
													placeholder="John, Sarah, Mike"
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
											<FormLabel>
												Project Context (Optional)
											</FormLabel>
											<FormControl>
												<Input
													placeholder="e.g., Q4 Product Launch, Website Redesign"
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
									className="w-full"
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
					<Card>
						<CardHeader>
							<div className="flex items-start justify-between">
								<div>
									<CardTitle>
										{result.summary.title}
									</CardTitle>
									<CardDescription className="mt-1 flex items-center gap-4">
										{result.summary.date && (
											<span className="flex items-center gap-1">
												<CalendarIcon className="size-4" />
												{result.summary.date}
											</span>
										)}
										{result.summary.duration && (
											<span className="flex items-center gap-1">
												<ClockIcon className="size-4" />
												{result.summary.duration}
											</span>
										)}
									</CardDescription>
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
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
						</CardHeader>
						<CardContent className="space-y-6">
							{result.summary.attendees.length > 0 && (
								<div className="flex items-center gap-2">
									<UsersIcon className="size-4 text-muted-foreground" />
									<div className="flex flex-wrap gap-1">
										{result.summary.attendees.map(
											(attendee, index) => (
												<Badge key={index} status="info">
													{attendee}
												</Badge>
											),
										)}
									</div>
								</div>
							)}

							<div>
								<h4 className="mb-2 font-semibold">
									Executive Summary
								</h4>
								<p className="text-muted-foreground text-sm">
									{result.executiveSummary}
								</p>
							</div>

							{result.keyTakeaways.length > 0 && (
								<div>
									<h4 className="mb-2 font-semibold">
										Key Takeaways
									</h4>
									<ul className="space-y-1">
										{result.keyTakeaways.map(
											(takeaway, index) => (
												<li
													key={index}
													className="flex items-start gap-2 text-sm"
												>
													<CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-green-500" />
													{takeaway}
												</li>
											),
										)}
									</ul>
								</div>
							)}
						</CardContent>
					</Card>

					{result.actionItems.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<ClipboardListIcon className="size-5" />
									Action Items ({result.actionItems.length})
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{result.actionItems.map((item) => (
										<div
											key={item.id}
											className="rounded-lg border p-3"
										>
											<div className="flex items-start justify-between gap-2">
												<div className="space-y-1">
													<div className="flex items-center gap-2">
														<span
															className={cn(
																"rounded-full px-2 py-0.5 text-xs font-medium",
																priorityColors[
																	item.priority
																],
															)}
														>
															{item.priority.toUpperCase()}
														</span>
														{item.assignee && (
															<span className="text-muted-foreground text-sm">
																@{item.assignee}
															</span>
														)}
													</div>
													<p className="font-medium">
														{item.task}
													</p>
												</div>
												{item.dueDate && (
													<span className="shrink-0 text-muted-foreground text-sm">
														Due: {item.dueDate}
													</span>
												)}
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{result.decisions.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<MessageSquareIcon className="size-5" />
									Decisions Made ({result.decisions.length})
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{result.decisions.map((decision, index) => (
										<div
											key={index}
											className="rounded-lg border p-3"
										>
											<p className="font-medium">
												{decision.decision}
											</p>
											{decision.rationale && (
												<p className="mt-1 text-muted-foreground text-sm">
													{decision.rationale}
												</p>
											)}
											{decision.madeBy && (
												<p className="mt-2 text-sm">
													<span className="text-muted-foreground">
														Decision by:
													</span>{" "}
													{decision.madeBy}
												</p>
											)}
											{decision.followUpRequired && (
												<Badge
													status="warning"
													className="mt-2"
												>
													Follow-up Required
												</Badge>
											)}
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{result.topics.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Discussion Topics</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{result.topics.map((topic, index) => (
										<div
											key={index}
											className="rounded-lg border p-4"
										>
											<h4 className="font-semibold">
												{topic.topic}
											</h4>
											<p className="mt-1 text-muted-foreground text-sm">
												{topic.summary}
											</p>
											{topic.keyPoints.length > 0 && (
												<ul className="mt-2 space-y-1">
													{topic.keyPoints.map(
														(point, i) => (
															<li
																key={i}
																className="flex items-start gap-2 text-sm"
															>
																<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
																{point}
															</li>
														),
													)}
												</ul>
											)}
											{topic.openQuestions.length > 0 && (
												<div className="mt-3 rounded-md bg-yellow-50 p-2 dark:bg-yellow-900/20">
													<p className="font-medium text-sm">
														Open Questions:
													</p>
													<ul className="mt-1 space-y-1">
														{topic.openQuestions.map(
															(q, i) => (
																<li
																	key={i}
																	className="text-sm"
																>
																	• {q}
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

					{result.followUpMeeting.recommended && (
						<Card>
							<CardHeader>
								<CardTitle>Follow-up Meeting</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="mb-3 text-muted-foreground text-sm">
									A follow-up meeting is recommended
									{result.followUpMeeting.suggestedDate &&
										` around ${result.followUpMeeting.suggestedDate}`}
								</p>
								{result.followUpMeeting.suggestedAgenda.length >
									0 && (
									<div>
										<h4 className="mb-2 font-semibold text-sm">
											Suggested Agenda:
										</h4>
										<ol className="list-inside list-decimal space-y-1 text-sm">
											{result.followUpMeeting.suggestedAgenda.map(
												(item, index) => (
													<li key={index}>{item}</li>
												),
											)}
										</ol>
									</div>
								)}
							</CardContent>
						</Card>
					)}

					<Button onClick={handleNewMeeting} variant="outline">
						Summarize Another Meeting
					</Button>
				</div>
			)}
		</div>
	);
}
