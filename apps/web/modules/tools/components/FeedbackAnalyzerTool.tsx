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
	MessageSquareTextIcon,
	SmilePlusIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
	TrendingUpIcon,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateJob } from "../hooks/use-job-polling";
import { JobProgressIndicator } from "./JobProgressIndicator";

const formSchema = z.object({
	feedback: z.string().min(1, "Feedback text is required"),
	analysisType: z.enum(["individual", "aggregate", "trends"]),
});

type FormValues = z.infer<typeof formSchema>;

interface SentimentAnalysis {
	overall:
		| "very_negative"
		| "negative"
		| "neutral"
		| "positive"
		| "very_positive";
	score: number;
	emotions: {
		joy: number;
		anger: number;
		sadness: number;
		fear: number;
		surprise: number;
		trust: number;
	};
}

interface Topic {
	name: string;
	sentiment: "negative" | "neutral" | "positive";
	mentions: number;
	keyPhrases: string[];
}

interface ActionableInsight {
	category: "product" | "service" | "support" | "pricing" | "other";
	priority: "low" | "medium" | "high" | "urgent";
	insight: string;
	suggestedAction: string;
	impactedArea: string;
	frequency: number;
}

interface FeedbackOutput {
	sentiment: SentimentAnalysis;
	topics: Topic[];
	keyThemes: string[];
	strengths: string[];
	weaknesses: string[];
	actionableInsights: ActionableInsight[];
	customerSegments: Array<{
		segment: string;
		size: number;
		avgSentiment: number;
		topConcerns: string[];
	}>;
	competitorMentions: Array<{
		competitor: string;
		context: string;
		sentiment: "negative" | "neutral" | "positive";
	}>;
	summary: string;
	recommendedPriorities: string[];
	npsIndicator: {
		estimatedScore: number | null;
		promoters: number;
		passives: number;
		detractors: number;
	};
}

const sentimentColors = {
	very_negative: "text-red-600",
	negative: "text-orange-500",
	neutral: "text-gray-500",
	positive: "text-green-500",
	very_positive: "text-green-600",
};

const sentimentLabels = {
	very_negative: "Very Negative",
	negative: "Negative",
	neutral: "Neutral",
	positive: "Positive",
	very_positive: "Very Positive",
};

const priorityColors = {
	low: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
	medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
	urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function SentimentGauge({ sentiment }: { sentiment: SentimentAnalysis }) {
	const percentage = ((sentiment.score + 1) / 2) * 100;

	return (
		<div className="flex items-center gap-4">
			<div className="relative h-3 flex-1 overflow-hidden rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500">
				<div
					className="absolute top-0 h-full w-1 bg-white shadow-md transition-all"
					style={{ left: `${percentage}%` }}
				/>
			</div>
			<span
				className={cn(
					"font-semibold",
					sentimentColors[sentiment.overall],
				)}
			>
				{sentimentLabels[sentiment.overall]}
			</span>
		</div>
	);
}

function NPSIndicator({
	nps,
}: { nps: FeedbackOutput["npsIndicator"] }) {
	const score = nps.estimatedScore ?? 0;
	const getColor = () => {
		if (score >= 50) return "text-green-500";
		if (score >= 0) return "text-yellow-500";
		return "text-red-500";
	};

	return (
		<div className="flex items-center gap-6">
			<div className="text-center">
				<p className={cn("text-3xl font-bold", getColor())}>{score}</p>
				<p className="text-muted-foreground text-xs">NPS Score</p>
			</div>
			<div className="flex gap-4 text-sm">
				<div className="text-center">
					<p className="font-semibold text-green-500">
						{nps.promoters}%
					</p>
					<p className="text-muted-foreground text-xs">Promoters</p>
				</div>
				<div className="text-center">
					<p className="font-semibold text-yellow-500">
						{nps.passives}%
					</p>
					<p className="text-muted-foreground text-xs">Passives</p>
				</div>
				<div className="text-center">
					<p className="font-semibold text-red-500">
						{nps.detractors}%
					</p>
					<p className="text-muted-foreground text-xs">Detractors</p>
				</div>
			</div>
		</div>
	);
}

export function FeedbackAnalyzerTool() {
	const [jobId, setJobId] = useState<string | null>(null);
	const [result, setResult] = useState<FeedbackOutput | null>(null);
	const createJobMutation = useCreateJob();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			feedback: "",
			analysisType: "individual",
		},
	});

	const onSubmit = async (values: FormValues) => {
		setResult(null);
		try {
			const response = await createJobMutation.mutateAsync({
				toolSlug: "feedback-analyzer",
				input: values,
			});
			setJobId(response.job.id);
		} catch (error) {
			console.error("Failed to create job:", error);
		}
	};

	const handleComplete = (output: Record<string, unknown>) => {
		setResult(output as unknown as FeedbackOutput);
	};

	const handleNewAnalysis = () => {
		setJobId(null);
		setResult(null);
		form.reset();
	};

	return (
		<div className="space-y-6">
			{!jobId && (
				<Card>
					<CardHeader>
						<div className="flex items-center gap-3">
							<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
								<MessageSquareTextIcon className="size-5 text-primary" />
							</div>
							<div>
								<CardTitle>Feedback Analyzer</CardTitle>
								<CardDescription>
									Analyze customer feedback to extract
									insights, sentiment, and actionable
									recommendations
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
									name="feedback"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Customer Feedback
											</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Paste customer feedback, reviews, or survey responses here..."
													className="min-h-[200px] text-sm"
													{...field}
												/>
											</FormControl>
											<FormDescription>
												Enter one or more pieces of
												customer feedback. Separate
												multiple entries with blank
												lines.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="analysisType"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Analysis Type</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select analysis type" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="individual">
														Individual - Analyze
														each feedback item
													</SelectItem>
													<SelectItem value="aggregate">
														Aggregate - Combined
														analysis
													</SelectItem>
													<SelectItem value="trends">
														Trends - Focus on
														patterns over time
													</SelectItem>
												</SelectContent>
											</Select>
											<FormDescription>
												Choose how to analyze the
												feedback
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
									Analyze Feedback
								</Button>
							</form>
						</Form>
					</CardContent>
				</Card>
			)}

			{jobId && !result && (
				<JobProgressIndicator
					jobId={jobId}
					title="Analyzing Feedback"
					description="AI is extracting insights from your customer feedback..."
					onComplete={handleComplete}
				/>
			)}

			{result && (
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Sentiment Analysis</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							<SentimentGauge sentiment={result.sentiment} />

							<div className="grid gap-4 md:grid-cols-3">
								{Object.entries(result.sentiment.emotions)
									.slice(0, 6)
									.map(([emotion, value]) => (
										<div
											key={emotion}
											className="space-y-1"
										>
											<div className="flex justify-between text-sm">
												<span className="capitalize">
													{emotion}
												</span>
												<span className="text-muted-foreground">
													{Math.round(value * 100)}%
												</span>
											</div>
											<div className="h-2 overflow-hidden rounded-full bg-muted">
												<div
													className="h-full bg-primary transition-all"
													style={{
														width: `${value * 100}%`,
													}}
												/>
											</div>
										</div>
									))}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<TrendingUpIcon className="size-5" />
								NPS Indicator
							</CardTitle>
						</CardHeader>
						<CardContent>
							<NPSIndicator nps={result.npsIndicator} />
						</CardContent>
					</Card>

					<div className="grid gap-6 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<ThumbsUpIcon className="size-5 text-green-500" />
									Strengths
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className="space-y-2">
									{result.strengths.map((strength, index) => (
										<li
											key={index}
											className="flex items-start gap-2 text-sm"
										>
											<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-green-500" />
											{strength}
										</li>
									))}
								</ul>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<ThumbsDownIcon className="size-5 text-red-500" />
									Weaknesses
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className="space-y-2">
									{result.weaknesses.map((weakness, index) => (
										<li
											key={index}
											className="flex items-start gap-2 text-sm"
										>
											<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-500" />
											{weakness}
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					</div>

					{result.topics.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Key Topics</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-2">
									{result.topics.map((topic, index) => (
										<div
											key={index}
											className={cn(
												"rounded-lg border px-3 py-2",
												topic.sentiment === "positive" &&
													"border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20",
												topic.sentiment === "negative" &&
													"border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20",
												topic.sentiment === "neutral" &&
													"border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20",
											)}
										>
											<p className="font-medium">
												{topic.name}
											</p>
											<p className="text-muted-foreground text-xs">
												{topic.mentions} mentions
											</p>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{result.actionableInsights.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<SmilePlusIcon className="size-5" />
									Actionable Insights
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{result.actionableInsights.map(
										(insight, index) => (
											<div
												key={index}
												className="rounded-lg border p-4"
											>
												<div className="flex items-start justify-between gap-2">
													<div className="space-y-1">
														<div className="flex items-center gap-2">
															<span
																className={cn(
																	"rounded-full px-2 py-0.5 text-xs font-medium",
																	priorityColors[
																		insight
																			.priority
																	],
																)}
															>
																{insight.priority.toUpperCase()}
															</span>
															<Badge status="info">
																{insight.category}
															</Badge>
														</div>
														<p className="font-medium">
															{insight.insight}
														</p>
													</div>
												</div>
												<div className="mt-3 rounded-md bg-muted/50 p-2">
													<p className="text-sm">
														<span className="font-medium">
															Suggested Action:
														</span>{" "}
														{insight.suggestedAction}
													</p>
												</div>
											</div>
										),
									)}
								</div>
							</CardContent>
						</Card>
					)}

					<Card>
						<CardHeader>
							<CardTitle>Summary</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground">
								{result.summary}
							</p>
							{result.recommendedPriorities.length > 0 && (
								<div className="mt-4">
									<h4 className="mb-2 font-semibold">
										Recommended Priorities
									</h4>
									<ol className="list-inside list-decimal space-y-1 text-sm">
										{result.recommendedPriorities.map(
											(priority, index) => (
												<li key={index}>{priority}</li>
											),
										)}
									</ol>
								</div>
							)}
						</CardContent>
					</Card>

					<Button onClick={handleNewAnalysis} variant="outline">
						Analyze More Feedback
					</Button>
				</div>
			)}
		</div>
	);
}
