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
	ArrowRightIcon,
	CheckCircle2Icon,
	FrownIcon,
	LightbulbIcon,
	MehIcon,
	MessageSquareTextIcon,
	RefreshCwIcon,
	SmileIcon,
	SparklesIcon,
	TagIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
	TrendingUpIcon,
	ZapIcon,
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

const sentimentConfig = {
	very_negative: {
		icon: FrownIcon,
		color: "text-red-600",
		bg: "bg-red-500",
		label: "Very Negative",
	},
	negative: {
		icon: FrownIcon,
		color: "text-orange-600",
		bg: "bg-orange-500",
		label: "Negative",
	},
	neutral: {
		icon: MehIcon,
		color: "text-gray-600",
		bg: "bg-gray-400",
		label: "Neutral",
	},
	positive: {
		icon: SmileIcon,
		color: "text-emerald-600",
		bg: "bg-emerald-500",
		label: "Positive",
	},
	very_positive: {
		icon: SmileIcon,
		color: "text-emerald-600",
		bg: "bg-emerald-600",
		label: "Very Positive",
	},
};

const priorityConfig = {
	low: {
		bg: "bg-gray-100 dark:bg-gray-900/50",
		text: "text-gray-700 dark:text-gray-400",
	},
	medium: {
		bg: "bg-blue-100 dark:bg-blue-900/50",
		text: "text-blue-700 dark:text-blue-400",
	},
	high: {
		bg: "bg-orange-100 dark:bg-orange-900/50",
		text: "text-orange-700 dark:text-orange-400",
	},
	urgent: {
		bg: "bg-red-100 dark:bg-red-900/50",
		text: "text-red-700 dark:text-red-400",
	},
};

function SentimentMeter({ sentiment }: { sentiment: SentimentAnalysis }) {
	const percentage = ((sentiment.score + 1) / 2) * 100;
	const config = sentimentConfig[sentiment.overall];
	const Icon = config.icon;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className={cn("flex size-12 items-center justify-center rounded-full", config.bg)}>
						<Icon className="size-6 text-white" />
					</div>
					<div>
						<p className={cn("font-bold text-xl", config.color)}>{config.label}</p>
						<p className="text-muted-foreground text-sm">Overall Sentiment</p>
					</div>
				</div>
				<div className="text-right">
					<p className="font-bold text-2xl">{Math.round(percentage)}%</p>
					<p className="text-muted-foreground text-sm">Positivity Score</p>
				</div>
			</div>
			<div className="relative h-3 overflow-hidden rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-500">
				<div
					className="absolute top-0 h-full w-1 rounded-full bg-white shadow-lg ring-2 ring-white transition-all"
					style={{ left: `calc(${percentage}% - 2px)` }}
				/>
			</div>
		</div>
	);
}

function NPSGauge({ nps }: { nps: FeedbackOutput["npsIndicator"] }) {
	const score = nps.estimatedScore ?? 0;
	const getColor = () => {
		if (score >= 50) return { ring: "stroke-emerald-500", text: "text-emerald-600", label: "Excellent" };
		if (score >= 0) return { ring: "stroke-amber-500", text: "text-amber-600", label: "Good" };
		return { ring: "stroke-red-500", text: "text-red-600", label: "Needs Work" };
	};
	const { ring, text, label } = getColor();
	const normalizedScore = Math.max(0, Math.min(100, score + 100)) / 2;
	const circumference = 2 * Math.PI * 45;
	const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

	return (
		<div className="flex items-center gap-6">
			<div className="relative size-28">
				<svg className="-rotate-90 size-28">
					<circle cx="56" cy="56" r="45" fill="none" strokeWidth="8" className="stroke-muted" />
					<circle
						cx="56"
						cy="56"
						r="45"
						fill="none"
						strokeWidth="8"
						strokeLinecap="round"
						className={ring}
						style={{
							strokeDasharray: circumference,
							strokeDashoffset,
							transition: "stroke-dashoffset 0.5s ease-in-out",
						}}
					/>
				</svg>
				<div className="absolute inset-0 flex flex-col items-center justify-center">
					<span className={cn("font-bold text-3xl", text)}>{score}</span>
					<span className="text-muted-foreground text-xs">NPS</span>
				</div>
			</div>
			<div className="space-y-3">
				<p className={cn("font-semibold", text)}>{label}</p>
				<div className="flex gap-4">
					<div className="text-center">
						<p className="font-bold text-emerald-600 text-lg">{nps.promoters}%</p>
						<p className="text-muted-foreground text-xs">Promoters</p>
					</div>
					<div className="text-center">
						<p className="font-bold text-amber-600 text-lg">{nps.passives}%</p>
						<p className="text-muted-foreground text-xs">Passives</p>
					</div>
					<div className="text-center">
						<p className="font-bold text-red-600 text-lg">{nps.detractors}%</p>
						<p className="text-muted-foreground text-xs">Detractors</p>
					</div>
				</div>
			</div>
		</div>
	);
}

function EmotionBar({ emotion, value }: { emotion: string; value: number }) {
	const percentage = Math.round(value * 100);
	const emotionColors: Record<string, string> = {
		joy: "bg-yellow-500",
		anger: "bg-red-500",
		sadness: "bg-blue-500",
		fear: "bg-purple-500",
		surprise: "bg-pink-500",
		trust: "bg-emerald-500",
	};

	return (
		<div className="space-y-1.5">
			<div className="flex justify-between text-sm">
				<span className="capitalize font-medium">{emotion}</span>
				<span className="text-muted-foreground">{percentage}%</span>
			</div>
			<div className="h-2 overflow-hidden rounded-full bg-muted">
				<div
					className={cn("h-full rounded-full transition-all", emotionColors[emotion] || "bg-primary")}
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	);
}

const analysisTypeDescriptions = {
	individual: "Analyze each piece of feedback separately",
	aggregate: "Combine all feedback for overall insights",
	trends: "Focus on patterns and trends over time",
};

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
		<div className="mx-auto max-w-4xl space-y-8">
			{!jobId && (
				<Card className="overflow-hidden border-0 shadow-lg">
					<div className="bg-gradient-to-r from-pink-500/10 via-pink-500/5 to-transparent p-6 pb-0">
						<div className="flex items-start gap-4">
							<div className="flex size-14 items-center justify-center rounded-2xl bg-pink-600 shadow-lg shadow-pink-500/25">
								<MessageSquareTextIcon className="size-7 text-white" />
							</div>
							<div className="flex-1">
								<h2 className="font-bold text-2xl tracking-tight">Feedback Analyzer</h2>
								<p className="mt-1 text-muted-foreground">
									Transform customer feedback into actionable insights with AI-powered sentiment analysis
								</p>
							</div>
						</div>
					</div>
					<CardContent className="p-6 pt-8">
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
								<FormField
									control={form.control}
									name="feedback"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center gap-2 font-semibold text-base">
												<SparklesIcon className="size-4 text-pink-600" />
												Customer Feedback
											</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Paste customer feedback, reviews, or survey responses here..."
													className="min-h-[200px] resize-none rounded-xl border-2 bg-muted/30 text-sm transition-colors focus:border-pink-500 focus:bg-background"
													{...field}
												/>
											</FormControl>
											<FormDescription className="text-muted-foreground/80">
												Enter one or more pieces of customer feedback. Separate multiple entries with blank lines.
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
											<FormLabel className="font-semibold text-base">Analysis Type</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger className="rounded-xl border-2 bg-muted/30 transition-colors focus:border-pink-500 focus:bg-background">
														<SelectValue placeholder="Select analysis type" />
													</SelectTrigger>
												</FormControl>
												<SelectContent className="rounded-xl">
													<SelectItem value="individual" className="rounded-lg">
														<div className="flex flex-col items-start">
															<span className="font-medium">Individual</span>
															<span className="text-muted-foreground text-xs">
																{analysisTypeDescriptions.individual}
															</span>
														</div>
													</SelectItem>
													<SelectItem value="aggregate" className="rounded-lg">
														<div className="flex flex-col items-start">
															<span className="font-medium">Aggregate</span>
															<span className="text-muted-foreground text-xs">
																{analysisTypeDescriptions.aggregate}
															</span>
														</div>
													</SelectItem>
													<SelectItem value="trends" className="rounded-lg">
														<div className="flex flex-col items-start">
															<span className="font-medium">Trends</span>
															<span className="text-muted-foreground text-xs">
																{analysisTypeDescriptions.trends}
															</span>
														</div>
													</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<Button
									type="submit"
									variant="primary"
									loading={form.formState.isSubmitting}
									className="h-12 w-full rounded-xl bg-pink-600 font-semibold text-base shadow-lg shadow-pink-500/25 transition-all hover:bg-pink-700 hover:shadow-xl hover:shadow-pink-500/30"
								>
									<SparklesIcon className="mr-2 size-5" />
									Analyze Feedback
									<ArrowRightIcon className="ml-2 size-5" />
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
					{/* Summary Header */}
					<Card className="overflow-hidden border-0 shadow-lg">
						<div className="bg-gradient-to-r from-pink-500/10 via-pink-500/5 to-transparent p-6">
							<div className="flex items-center gap-2 mb-4">
								<CheckCircle2Icon className="size-5 text-emerald-600" />
								<span className="font-medium text-emerald-600">Analysis Complete</span>
							</div>
							<SentimentMeter sentiment={result.sentiment} />
						</div>
						<CardContent className="p-6">
							<div className="grid gap-4 md:grid-cols-3">
								{Object.entries(result.sentiment.emotions).map(([emotion, value]) => (
									<EmotionBar key={emotion} emotion={emotion} value={value} />
								))}
							</div>
						</CardContent>
					</Card>

					{/* NPS Indicator */}
					<Card className="border-0 shadow-md">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<TrendingUpIcon className="size-5 text-blue-500" />
								Net Promoter Score
							</CardTitle>
							<CardDescription>Customer loyalty indicator based on feedback analysis</CardDescription>
						</CardHeader>
						<CardContent>
							<NPSGauge nps={result.npsIndicator} />
						</CardContent>
					</Card>

					{/* Strengths & Weaknesses */}
					<div className="grid gap-6 lg:grid-cols-2">
						<Card className="border-0 bg-gradient-to-br from-emerald-50 to-transparent shadow-md dark:from-emerald-950/20">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<ThumbsUpIcon className="size-5 text-emerald-600" />
									Strengths
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className="space-y-3">
									{result.strengths.map((strength, index) => (
										<li key={index} className="flex items-start gap-3">
											<div className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
												<CheckCircle2Icon className="size-3 text-emerald-600" />
											</div>
											<p className="text-sm">{strength}</p>
										</li>
									))}
								</ul>
							</CardContent>
						</Card>

						<Card className="border-0 bg-gradient-to-br from-red-50 to-transparent shadow-md dark:from-red-950/20">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<ThumbsDownIcon className="size-5 text-red-600" />
									Areas for Improvement
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className="space-y-3">
									{result.weaknesses.map((weakness, index) => (
										<li key={index} className="flex items-start gap-3">
											<div className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
												<span className="font-bold text-red-600 text-xs">!</span>
											</div>
											<p className="text-sm">{weakness}</p>
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					</div>

					{/* Key Topics */}
					{result.topics.length > 0 && (
						<Card className="border-0 shadow-md">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<TagIcon className="size-5 text-violet-500" />
									Key Topics
								</CardTitle>
								<CardDescription>Most discussed themes in the feedback</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-3">
									{result.topics.map((topic, index) => {
										const sentimentColor = {
											positive: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20",
											negative: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20",
											neutral: "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50",
										};
										return (
											<div
												key={index}
												className={cn(
													"rounded-xl border px-4 py-3 transition-colors hover:shadow-sm",
													sentimentColor[topic.sentiment]
												)}
											>
												<p className="font-semibold">{topic.name}</p>
												<p className="mt-1 text-muted-foreground text-sm">
													{topic.mentions} mentions
												</p>
											</div>
										);
									})}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Actionable Insights */}
					{result.actionableInsights.length > 0 && (
						<Card className="border-0 shadow-md">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<ZapIcon className="size-5 text-amber-500" />
									Actionable Insights
									<Badge status="info" className="ml-2">{result.actionableInsights.length}</Badge>
								</CardTitle>
								<CardDescription>Recommended actions based on feedback analysis</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{result.actionableInsights.map((insight, index) => {
										const config = priorityConfig[insight.priority];
										return (
											<div
												key={index}
												className="rounded-xl border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
											>
												<div className="flex flex-wrap items-center gap-2 mb-2">
													<span className={cn("rounded-full px-2.5 py-1 font-medium text-xs", config.bg, config.text)}>
														{insight.priority.toUpperCase()}
													</span>
													<Badge status="info">{insight.category}</Badge>
												</div>
												<p className="font-semibold">{insight.insight}</p>
												<div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
													<LightbulbIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
													<p className="text-sm">
														<span className="font-medium">Suggested Action:</span> {insight.suggestedAction}
													</p>
												</div>
											</div>
										);
									})}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Summary */}
					<Card className="border-0 shadow-md">
						<CardHeader>
							<CardTitle>Summary</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-muted-foreground leading-relaxed">{result.summary}</p>
							{result.recommendedPriorities.length > 0 && (
								<div className="rounded-xl bg-muted/50 p-4">
									<h4 className="mb-3 font-semibold">Recommended Priorities</h4>
									<ol className="space-y-2">
										{result.recommendedPriorities.map((priority, index) => (
											<li key={index} className="flex items-start gap-3 text-sm">
												<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-xs">
													{index + 1}
												</span>
												{priority}
											</li>
										))}
									</ol>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Action Button */}
					<div className="flex justify-center pt-2">
						<Button
							onClick={handleNewAnalysis}
							variant="outline"
							className="h-11 rounded-xl px-6"
						>
							<RefreshCwIcon className="mr-2 size-4" />
							Analyze More Feedback
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
