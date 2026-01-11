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
	AlertTriangleIcon,
	ArrowRightIcon,
	CalendarIcon,
	CheckCircle2Icon,
	ClipboardCheckIcon,
	FileTextIcon,
	GavelIcon,
	LightbulbIcon,
	RefreshCwIcon,
	ScaleIcon,
	ShieldAlertIcon,
	ShieldCheckIcon,
	SparklesIcon,
	UsersIcon,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateJob } from "../hooks/use-job-polling";
import { JobProgressIndicator } from "./JobProgressIndicator";

const formSchema = z.object({
	contractText: z.string().min(1, "Contract text is required"),
	analysisDepth: z.enum(["summary", "standard", "detailed"]),
});

type FormValues = z.infer<typeof formSchema>;

interface RiskItem {
	category: string;
	description: string;
	severity: "low" | "medium" | "high" | "critical";
	clause: string | null;
	recommendation: string;
}

interface Obligation {
	party: string;
	description: string;
	deadline: string | null;
	isRecurring: boolean;
	frequency: string | null;
}

interface ContractOutput {
	summary: {
		contractType: string;
		parties: Array<{ name: string; role: string }>;
		effectiveDate: string | null;
		expirationDate: string | null;
		governingLaw: string | null;
		overview: string;
	};
	keyTerms: Array<{
		term: string;
		definition: string;
		section: string | null;
	}>;
	financialTerms: {
		totalValue: number | null;
		currency: string | null;
		paymentSchedule: string | null;
		penalties: string[];
	};
	obligations: Obligation[];
	risks: RiskItem[];
	termination: {
		noticePeriod: string | null;
		terminationClauses: string[];
		autoRenewal: boolean | null;
		renewalTerms: string | null;
	};
	intellectualProperty: {
		ownership: string | null;
		licenses: string[];
		restrictions: string[];
	};
	confidentiality: {
		hasNDA: boolean;
		duration: string | null;
		scope: string | null;
	};
	disputeResolution: {
		method: string | null;
		venue: string | null;
		arbitrationRules: string | null;
	};
	overallRiskScore: number;
	recommendations: string[];
}

const severityConfig = {
	low: {
		bg: "bg-emerald-50 dark:bg-emerald-950/30",
		border: "border-emerald-200 dark:border-emerald-800",
		text: "text-emerald-700 dark:text-emerald-400",
		badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
	},
	medium: {
		bg: "bg-amber-50 dark:bg-amber-950/30",
		border: "border-amber-200 dark:border-amber-800",
		text: "text-amber-700 dark:text-amber-400",
		badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
	},
	high: {
		bg: "bg-orange-50 dark:bg-orange-950/30",
		border: "border-orange-200 dark:border-orange-800",
		text: "text-orange-700 dark:text-orange-400",
		badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400",
	},
	critical: {
		bg: "bg-red-50 dark:bg-red-950/30",
		border: "border-red-200 dark:border-red-800",
		text: "text-red-700 dark:text-red-400",
		badge: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
	},
};

function RiskScoreGauge({ score }: { score: number }) {
	const getColor = () => {
		if (score <= 25) return { ring: "stroke-emerald-500", text: "text-emerald-600", label: "Low Risk" };
		if (score <= 50) return { ring: "stroke-amber-500", text: "text-amber-600", label: "Moderate Risk" };
		if (score <= 75) return { ring: "stroke-orange-500", text: "text-orange-600", label: "High Risk" };
		return { ring: "stroke-red-500", text: "text-red-600", label: "Critical Risk" };
	};
	const { ring, text, label } = getColor();
	const circumference = 2 * Math.PI * 45;
	const strokeDashoffset = circumference - (score / 100) * circumference;

	return (
		<div className="flex items-center gap-4">
			<div className="relative size-24">
				<svg className="-rotate-90 size-24">
					<circle
						cx="48"
						cy="48"
						r="45"
						fill="none"
						strokeWidth="6"
						className="stroke-muted"
					/>
					<circle
						cx="48"
						cy="48"
						r="45"
						fill="none"
						strokeWidth="6"
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
					<span className={cn("font-bold text-2xl", text)}>{score}</span>
				</div>
			</div>
			<div>
				<p className={cn("font-semibold", text)}>{label}</p>
				<p className="text-muted-foreground text-sm">Overall Risk Score</p>
			</div>
		</div>
	);
}

const depthDescriptions = {
	summary: "Quick overview of key terms and risks",
	standard: "Comprehensive analysis with recommendations",
	detailed: "In-depth review with clause-by-clause analysis",
};

export function ContractAnalyzerTool() {
	const [jobId, setJobId] = useState<string | null>(null);
	const [result, setResult] = useState<ContractOutput | null>(null);
	const createJobMutation = useCreateJob();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			contractText: "",
			analysisDepth: "standard",
		},
	});

	const onSubmit = async (values: FormValues) => {
		setResult(null);
		try {
			const response = await createJobMutation.mutateAsync({
				toolSlug: "contract-analyzer",
				input: values,
			});
			setJobId(response.job.id);
		} catch (error) {
			console.error("Failed to create job:", error);
		}
	};

	const handleComplete = (output: Record<string, unknown>) => {
		setResult(output as unknown as ContractOutput);
	};

	const handleNewContract = () => {
		setJobId(null);
		setResult(null);
		form.reset();
	};

	return (
		<div className="mx-auto max-w-4xl space-y-8">
			{!jobId && (
				<Card className="overflow-hidden border-0 shadow-lg">
					<div className="bg-gradient-to-r from-violet-500/10 via-violet-500/5 to-transparent p-6 pb-0">
						<div className="flex items-start gap-4">
							<div className="flex size-14 items-center justify-center rounded-2xl bg-violet-600 shadow-lg shadow-violet-500/25">
								<FileTextIcon className="size-7 text-white" />
							</div>
							<div className="flex-1">
								<h2 className="font-bold text-2xl tracking-tight">Contract Analyzer</h2>
								<p className="mt-1 text-muted-foreground">
									AI-powered analysis to identify risks, obligations, and key terms in your contracts
								</p>
							</div>
						</div>
					</div>
					<CardContent className="p-6 pt-8">
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
								<FormField
									control={form.control}
									name="contractText"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center gap-2 font-semibold text-base">
												<SparklesIcon className="size-4 text-violet-600" />
												Contract Text
											</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Paste your contract text here..."
													className="min-h-[280px] resize-none rounded-xl border-2 bg-muted/30 font-mono text-sm transition-colors focus:border-violet-500 focus:bg-background"
													{...field}
												/>
											</FormControl>
											<FormDescription className="text-muted-foreground/80">
												Paste the full text of your contract for comprehensive AI analysis
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="analysisDepth"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="font-semibold text-base">Analysis Depth</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger className="rounded-xl border-2 bg-muted/30 transition-colors focus:border-violet-500 focus:bg-background">
														<SelectValue placeholder="Select analysis depth" />
													</SelectTrigger>
												</FormControl>
												<SelectContent className="rounded-xl">
													<SelectItem value="summary" className="rounded-lg">
														<div className="flex flex-col items-start">
															<span className="font-medium">Summary</span>
															<span className="text-muted-foreground text-xs">
																{depthDescriptions.summary}
															</span>
														</div>
													</SelectItem>
													<SelectItem value="standard" className="rounded-lg">
														<div className="flex flex-col items-start">
															<span className="font-medium">Standard</span>
															<span className="text-muted-foreground text-xs">
																{depthDescriptions.standard}
															</span>
														</div>
													</SelectItem>
													<SelectItem value="detailed" className="rounded-lg">
														<div className="flex flex-col items-start">
															<span className="font-medium">Detailed</span>
															<span className="text-muted-foreground text-xs">
																{depthDescriptions.detailed}
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
									className="h-12 w-full rounded-xl bg-violet-600 font-semibold text-base shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-500/30"
								>
									<ScaleIcon className="mr-2 size-5" />
									Analyze Contract
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
					title="Analyzing Contract"
					description="AI is reviewing your contract for risks, obligations, and key terms..."
					onComplete={handleComplete}
				/>
			)}

			{result && (
				<div className="space-y-6">
					{/* Summary Header */}
					<Card className="overflow-hidden border-0 shadow-lg">
						<div className="bg-gradient-to-r from-violet-500/10 via-violet-500/5 to-transparent p-6">
							<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<CheckCircle2Icon className="size-5 text-emerald-600" />
										<span className="font-medium text-emerald-600">Analysis Complete</span>
									</div>
									<h3 className="mt-2 font-bold text-2xl">{result.summary.contractType}</h3>
									<p className="mt-2 text-muted-foreground">{result.summary.overview}</p>

									<div className="mt-4 flex flex-wrap items-center gap-4">
										{result.summary.parties.map((party, index) => (
											<div key={index} className="flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5">
												<UsersIcon className="size-4 text-muted-foreground" />
												<span className="font-medium text-sm">{party.name}</span>
												<span className="text-muted-foreground text-xs">({party.role})</span>
											</div>
										))}
									</div>
								</div>
								<RiskScoreGauge score={result.overallRiskScore} />
							</div>
						</div>
						<CardContent className="p-6 pt-0">
							<div className="grid gap-4 sm:grid-cols-3">
								{result.summary.effectiveDate && (
									<div className="rounded-xl bg-muted/50 p-4">
										<p className="flex items-center gap-2 text-muted-foreground text-sm">
											<CalendarIcon className="size-4" />
											Effective Date
										</p>
										<p className="mt-1 font-semibold">{result.summary.effectiveDate}</p>
									</div>
								)}
								{result.summary.expirationDate && (
									<div className="rounded-xl bg-muted/50 p-4">
										<p className="flex items-center gap-2 text-muted-foreground text-sm">
											<CalendarIcon className="size-4" />
											Expiration Date
										</p>
										<p className="mt-1 font-semibold">{result.summary.expirationDate}</p>
									</div>
								)}
								{result.summary.governingLaw && (
									<div className="rounded-xl bg-muted/50 p-4">
										<p className="flex items-center gap-2 text-muted-foreground text-sm">
											<GavelIcon className="size-4" />
											Governing Law
										</p>
										<p className="mt-1 font-semibold">{result.summary.governingLaw}</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Risks */}
					{result.risks.length > 0 && (
						<Card className="border-0 shadow-md">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<ShieldAlertIcon className="size-5 text-orange-500" />
									Identified Risks
									<Badge status="warning" className="ml-2">
										{result.risks.length} {result.risks.length === 1 ? "risk" : "risks"}
									</Badge>
								</CardTitle>
								<CardDescription>Potential concerns identified in this contract</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{result.risks.map((risk, index) => {
										const config = severityConfig[risk.severity];
										return (
											<div
												key={index}
												className={cn(
													"rounded-xl border p-4 transition-colors",
													config.bg,
													config.border
												)}
											>
												<div className="flex items-start justify-between gap-3">
													<div className="flex-1 space-y-2">
														<div className="flex flex-wrap items-center gap-2">
															<span
																className={cn(
																	"rounded-full px-2.5 py-1 font-medium text-xs",
																	config.badge
																)}
															>
																{risk.severity.toUpperCase()}
															</span>
															<span className="font-semibold">{risk.category}</span>
														</div>
														<p className="text-muted-foreground text-sm">{risk.description}</p>
													</div>
												</div>
												{risk.recommendation && (
													<div className="mt-3 flex items-start gap-2 rounded-lg bg-background/50 p-3">
														<LightbulbIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
														<p className="text-sm">
															<span className="font-medium">Recommendation:</span> {risk.recommendation}
														</p>
													</div>
												)}
											</div>
										);
									})}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Obligations */}
					{result.obligations.length > 0 && (
						<Card className="border-0 shadow-md">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<ClipboardCheckIcon className="size-5 text-blue-500" />
									Key Obligations
								</CardTitle>
								<CardDescription>Responsibilities and commitments by party</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{result.obligations.map((obligation, index) => (
										<div
											key={index}
											className="flex items-start justify-between gap-4 rounded-xl border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
										>
											<div className="flex-1">
												<div className="flex items-center gap-2">
													<span className="rounded-full bg-blue-100 px-2.5 py-0.5 font-medium text-blue-700 text-xs dark:bg-blue-900/50 dark:text-blue-400">
														{obligation.party}
													</span>
													{obligation.isRecurring && (
														<Badge status="info">Recurring</Badge>
													)}
												</div>
												<p className="mt-2 text-sm">{obligation.description}</p>
											</div>
											{obligation.deadline && (
												<div className="shrink-0 text-right">
													<p className="text-muted-foreground text-xs">Deadline</p>
													<p className="font-medium text-sm">{obligation.deadline}</p>
												</div>
											)}
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Recommendations */}
					{result.recommendations.length > 0 && (
						<Card className="border-0 bg-gradient-to-br from-emerald-50 to-transparent shadow-md dark:from-emerald-950/20">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<ShieldCheckIcon className="size-5 text-emerald-600" />
									Recommendations
								</CardTitle>
								<CardDescription>Suggested actions based on the analysis</CardDescription>
							</CardHeader>
							<CardContent>
								<ul className="space-y-3">
									{result.recommendations.map((rec, index) => (
										<li key={index} className="flex items-start gap-3">
											<div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
												<span className="font-semibold text-emerald-700 text-xs dark:text-emerald-400">
													{index + 1}
												</span>
											</div>
											<p className="text-sm">{rec}</p>
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					)}

					{/* Action Button */}
					<div className="flex justify-center pt-2">
						<Button
							onClick={handleNewContract}
							variant="outline"
							className="h-11 rounded-xl px-6"
						>
							<RefreshCwIcon className="mr-2 size-4" />
							Analyze Another Contract
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
