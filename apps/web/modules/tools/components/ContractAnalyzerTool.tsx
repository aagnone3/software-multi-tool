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
	FileTextIcon,
	ShieldAlertIcon,
	ShieldCheckIcon,
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

const severityColors = {
	low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
	medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
	high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
	critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function RiskScoreIndicator({ score }: { score: number }) {
	const getColor = () => {
		if (score <= 25) return "text-green-500";
		if (score <= 50) return "text-yellow-500";
		if (score <= 75) return "text-orange-500";
		return "text-red-500";
	};

	const getIcon = () => {
		if (score <= 50) {
			return <ShieldCheckIcon className={cn("size-8", getColor())} />;
		}
		return <ShieldAlertIcon className={cn("size-8", getColor())} />;
	};

	return (
		<div className="flex items-center gap-3">
			{getIcon()}
			<div>
				<p className={cn("text-2xl font-bold", getColor())}>{score}</p>
				<p className="text-muted-foreground text-xs">Risk Score</p>
			</div>
		</div>
	);
}

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
		<div className="space-y-6">
			{!jobId && (
				<Card>
					<CardHeader>
						<div className="flex items-center gap-3">
							<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
								<FileTextIcon className="size-5 text-primary" />
							</div>
							<div>
								<CardTitle>Contract Analyzer</CardTitle>
								<CardDescription>
									AI-powered contract analysis to identify
									risks, obligations, and key terms
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
									name="contractText"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Contract Text</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Paste your contract text here..."
													className="min-h-[250px] font-mono text-sm"
													{...field}
												/>
											</FormControl>
											<FormDescription>
												Paste the full text of your
												contract for AI analysis
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
											<FormLabel>
												Analysis Depth
											</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select analysis depth" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="summary">
														Summary - Quick overview
													</SelectItem>
													<SelectItem value="standard">
														Standard - Balanced
														analysis
													</SelectItem>
													<SelectItem value="detailed">
														Detailed - In-depth
														review
													</SelectItem>
												</SelectContent>
											</Select>
											<FormDescription>
												Choose how thorough the analysis
												should be
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
									Analyze Contract
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
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>Contract Analysis</CardTitle>
								<RiskScoreIndicator
									score={result.overallRiskScore}
								/>
							</div>
							<CardDescription>
								{result.summary.contractType} •{" "}
								{result.summary.parties
									.map((p) => p.name)
									.join(" & ")}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div>
								<h4 className="mb-2 font-semibold">Overview</h4>
								<p className="text-muted-foreground text-sm">
									{result.summary.overview}
								</p>
							</div>

							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<p className="text-sm">
										<span className="text-muted-foreground">
											Effective Date:
										</span>{" "}
										{result.summary.effectiveDate ?? "N/A"}
									</p>
									<p className="text-sm">
										<span className="text-muted-foreground">
											Expiration Date:
										</span>{" "}
										{result.summary.expirationDate ?? "N/A"}
									</p>
								</div>
								<div className="space-y-2">
									<p className="text-sm">
										<span className="text-muted-foreground">
											Governing Law:
										</span>{" "}
										{result.summary.governingLaw ?? "N/A"}
									</p>
									{result.financialTerms.totalValue && (
										<p className="text-sm">
											<span className="text-muted-foreground">
												Total Value:
											</span>{" "}
											{result.financialTerms.currency ??
												"$"}
											{result.financialTerms.totalValue.toLocaleString()}
										</p>
									)}
								</div>
							</div>
						</CardContent>
					</Card>

					{result.risks.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<AlertTriangleIcon className="size-5 text-orange-500" />
									Identified Risks
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{result.risks.map((risk, index) => (
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
																severityColors[
																	risk
																		.severity
																],
															)}
														>
															{risk.severity.toUpperCase()}
														</span>
														<span className="font-medium">
															{risk.category}
														</span>
													</div>
													<p className="text-muted-foreground text-sm">
														{risk.description}
													</p>
												</div>
											</div>
											{risk.recommendation && (
												<div className="mt-3 rounded-md bg-muted/50 p-2">
													<p className="text-sm">
														<span className="font-medium">
															Recommendation:
														</span>{" "}
														{risk.recommendation}
													</p>
												</div>
											)}
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{result.obligations.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Key Obligations</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{result.obligations.map(
										(obligation, index) => (
											<div
												key={index}
												className="flex items-start justify-between rounded-lg border p-3"
											>
												<div>
													<p className="font-medium">
														{obligation.party}
													</p>
													<p className="text-muted-foreground text-sm">
														{obligation.description}
													</p>
												</div>
												<div className="text-right text-sm">
													{obligation.deadline && (
														<p>
															Due:{" "}
															{obligation.deadline}
														</p>
													)}
													{obligation.isRecurring && (
														<Badge status="info">
															Recurring
														</Badge>
													)}
												</div>
											</div>
										),
									)}
								</div>
							</CardContent>
						</Card>
					)}

					{result.recommendations.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Recommendations</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className="space-y-2">
									{result.recommendations.map((rec, index) => (
										<li
											key={index}
											className="flex items-start gap-2 text-sm"
										>
											<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
											{rec}
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					)}

					<Button onClick={handleNewContract} variant="outline">
						Analyze Another Contract
					</Button>
				</div>
			)}
		</div>
	);
}
