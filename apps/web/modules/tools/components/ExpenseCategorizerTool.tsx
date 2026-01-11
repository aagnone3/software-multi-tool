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
	AlertTriangleIcon,
	CheckCircleIcon,
	DollarSignIcon,
	PlusIcon,
	TrashIcon,
	WalletIcon,
} from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateJob } from "../hooks/use-job-polling";
import { JobProgressIndicator } from "./JobProgressIndicator";

const expenseItemSchema = z.object({
	description: z.string().min(1, "Description is required"),
	amount: z.number().positive("Amount must be positive"),
	date: z.string().optional(),
	vendor: z.string().optional(),
});

const formSchema = z.object({
	expenses: z.array(expenseItemSchema).min(1, "At least one expense is required"),
	businessType: z.string().optional(),
	taxYear: z.number().optional(),
	country: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface TaxCategory {
	irsCategory: string;
	scheduleLocation: string;
	isDeductible: boolean;
	deductionPercentage: number;
	notes: string | null;
}

interface CategorizedExpense {
	originalDescription: string;
	amount: number;
	date: string | null;
	vendor: string | null;
	category: string;
	subcategory: string | null;
	taxInfo: TaxCategory;
	confidence: number;
	flags: string[];
	suggestedNotes: string | null;
}

interface ExpenseOutput {
	categorizedExpenses: CategorizedExpense[];
	summary: {
		totalAmount: number;
		totalDeductible: number;
		totalNonDeductible: number;
		categoryBreakdown: Array<{
			category: string;
			amount: number;
			count: number;
			deductibleAmount: number;
		}>;
	};
	taxInsights: {
		estimatedDeductions: number;
		potentialRedFlags: Array<{
			expense: string;
			reason: string;
			recommendation: string;
		}>;
		missingDocumentation: string[];
		optimizationSuggestions: string[];
	};
	exportFormats: {
		quickbooksReady: boolean;
		xeroReady: boolean;
		csvAvailable: boolean;
	};
}

const categoryLabels: Record<string, string> = {
	advertising: "Advertising",
	car_vehicle: "Car & Vehicle",
	commissions_fees: "Commissions & Fees",
	contract_labor: "Contract Labor",
	depreciation: "Depreciation",
	employee_benefits: "Employee Benefits",
	insurance: "Insurance",
	interest_mortgage: "Mortgage Interest",
	interest_other: "Other Interest",
	legal_professional: "Legal & Professional",
	office_expense: "Office Expense",
	pension_profit_sharing: "Pension & Profit Sharing",
	rent_lease_equipment: "Equipment Rent/Lease",
	rent_lease_property: "Property Rent/Lease",
	repairs_maintenance: "Repairs & Maintenance",
	supplies: "Supplies",
	taxes_licenses: "Taxes & Licenses",
	travel: "Travel",
	meals_entertainment: "Meals & Entertainment",
	utilities: "Utilities",
	wages: "Wages",
	other: "Other",
	personal: "Personal (Non-Deductible)",
};

export function ExpenseCategorizerTool() {
	const [jobId, setJobId] = useState<string | null>(null);
	const [result, setResult] = useState<ExpenseOutput | null>(null);
	const [inputMode, setInputMode] = useState<"form" | "text">("form");
	const [bulkText, setBulkText] = useState("");
	const createJobMutation = useCreateJob();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			expenses: [{ description: "", amount: 0 }],
			businessType: "",
			country: "US",
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "expenses",
	});

	const parseBulkText = () => {
		const lines = bulkText.split("\n").filter((line) => line.trim());
		const expenses: Array<{ description: string; amount: number }> = [];

		for (const line of lines) {
			const match = line.match(
				/(.+?)\s*[\-:]\s*\$?([\d,]+\.?\d*)/,
			);
			if (match) {
				expenses.push({
					description: match[1].trim(),
					amount: Number.parseFloat(match[2].replace(",", "")),
				});
			}
		}

		if (expenses.length > 0) {
			form.setValue("expenses", expenses);
			setInputMode("form");
		}
	};

	const onSubmit = async (values: FormValues) => {
		setResult(null);
		try {
			const response = await createJobMutation.mutateAsync({
				toolSlug: "expense-categorizer",
				input: values,
			});
			setJobId(response.job.id);
		} catch (error) {
			console.error("Failed to create job:", error);
		}
	};

	const handleComplete = (output: Record<string, unknown>) => {
		setResult(output as unknown as ExpenseOutput);
	};

	const handleNewAnalysis = () => {
		setJobId(null);
		setResult(null);
		form.reset();
		setBulkText("");
	};

	return (
		<div className="space-y-6">
			{!jobId && (
				<Card>
					<CardHeader>
						<div className="flex items-center gap-3">
							<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
								<WalletIcon className="size-5 text-primary" />
							</div>
							<div>
								<CardTitle>Expense Categorizer</CardTitle>
								<CardDescription>
									Automatically categorize business expenses
									for tax deductions and accounting
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="mb-6 flex gap-2">
							<Button
								type="button"
								variant={inputMode === "form" ? "primary" : "outline"}
								size="sm"
								onClick={() => setInputMode("form")}
							>
								Form Entry
							</Button>
							<Button
								type="button"
								variant={inputMode === "text" ? "primary" : "outline"}
								size="sm"
								onClick={() => setInputMode("text")}
							>
								Bulk Text
							</Button>
						</div>

						{inputMode === "text" ? (
							<div className="space-y-4">
								<div>
									<label className="mb-2 block font-medium text-sm">
										Paste Expenses
									</label>
									<Textarea
										placeholder="Office supplies - $45.99&#10;Software subscription - $29.99&#10;Client lunch: $85.00"
										className="min-h-[200px] font-mono text-sm"
										value={bulkText}
										onChange={(e) =>
											setBulkText(e.target.value)
										}
									/>
									<p className="mt-1 text-muted-foreground text-sm">
										Enter one expense per line with amount
										(e.g., "Description - $amount")
									</p>
								</div>
								<Button
									type="button"
									onClick={parseBulkText}
									className="w-full"
								>
									Parse Expenses
								</Button>
							</div>
						) : (
							<Form {...form}>
								<form
									onSubmit={form.handleSubmit(onSubmit)}
									className="space-y-6"
								>
									<div className="space-y-4">
										{fields.map((field, index) => (
											<div
												key={field.id}
												className="flex gap-3"
											>
												<FormField
													control={form.control}
													name={`expenses.${index}.description`}
													render={({ field }) => (
														<FormItem className="flex-1">
															{index === 0 && (
																<FormLabel>
																	Description
																</FormLabel>
															)}
															<FormControl>
																<Input
																	placeholder="Office supplies"
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name={`expenses.${index}.amount`}
													render={({ field }) => (
														<FormItem className="w-32">
															{index === 0 && (
																<FormLabel>
																	Amount
																</FormLabel>
															)}
															<FormControl>
																<div className="relative">
																	<DollarSignIcon className="absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
																	<Input
																		type="number"
																		step="0.01"
																		placeholder="0.00"
																		className="pl-7"
																		value={field.value}
																		onChange={(e) =>
																			field.onChange(
																				e.target.value
																					? Number.parseFloat(
																							e.target.value,
																						)
																					: 0,
																			)
																		}
																	/>
																</div>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												{fields.length > 1 && (
													<Button
														type="button"
														variant="ghost"
														size="icon"
														className={cn(
															index === 0 &&
																"mt-8",
														)}
														onClick={() =>
															remove(index)
														}
													>
														<TrashIcon className="size-4" />
													</Button>
												)}
											</div>
										))}
									</div>

									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() =>
											append({
												description: "",
												amount: 0,
											})
										}
									>
										<PlusIcon className="mr-2 size-4" />
										Add Expense
									</Button>

									<div className="grid gap-4 md:grid-cols-2">
										<FormField
											control={form.control}
											name="businessType"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														Business Type (Optional)
													</FormLabel>
													<FormControl>
														<Input
															placeholder="e.g., Consulting, Retail, SaaS"
															{...field}
														/>
													</FormControl>
													<FormDescription>
														Helps with more accurate
														categorization
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="country"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Country</FormLabel>
													<Select
														onValueChange={
															field.onChange
														}
														defaultValue={
															field.value
														}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select country" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="US">
																United States
															</SelectItem>
															<SelectItem value="CA">
																Canada
															</SelectItem>
															<SelectItem value="UK">
																United Kingdom
															</SelectItem>
															<SelectItem value="AU">
																Australia
															</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<Button
										type="submit"
										variant="primary"
										loading={form.formState.isSubmitting}
										className="w-full"
									>
										Categorize Expenses
									</Button>
								</form>
							</Form>
						)}
					</CardContent>
				</Card>
			)}

			{jobId && !result && (
				<JobProgressIndicator
					jobId={jobId}
					title="Categorizing Expenses"
					description="AI is analyzing and categorizing your expenses..."
					onComplete={handleComplete}
				/>
			)}

			{result && (
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Summary</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid gap-6 md:grid-cols-3">
								<div className="rounded-lg border p-4 text-center">
									<p className="text-muted-foreground text-sm">
										Total Expenses
									</p>
									<p className="text-2xl font-bold">
										$
										{result.summary.totalAmount.toLocaleString(
											undefined,
											{ minimumFractionDigits: 2 },
										)}
									</p>
								</div>
								<div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-900/20">
									<p className="text-muted-foreground text-sm">
										Deductible
									</p>
									<p className="text-2xl font-bold text-green-600">
										$
										{result.summary.totalDeductible.toLocaleString(
											undefined,
											{ minimumFractionDigits: 2 },
										)}
									</p>
								</div>
								<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20">
									<p className="text-muted-foreground text-sm">
										Non-Deductible
									</p>
									<p className="text-2xl font-bold text-red-600">
										$
										{result.summary.totalNonDeductible.toLocaleString(
											undefined,
											{ minimumFractionDigits: 2 },
										)}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Categorized Expenses</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="rounded-md border">
								<table className="w-full text-sm">
									<thead className="border-b bg-muted/50">
										<tr>
											<th className="p-3 text-left">
												Description
											</th>
											<th className="p-3 text-left">
												Category
											</th>
											<th className="p-3 text-right">
												Amount
											</th>
											<th className="p-3 text-center">
												Deductible
											</th>
											<th className="p-3 text-right">
												Confidence
											</th>
										</tr>
									</thead>
									<tbody>
										{result.categorizedExpenses.map(
											(expense, index) => (
												<tr
													key={index}
													className="border-b last:border-0"
												>
													<td className="p-3">
														<p className="font-medium">
															{
																expense.originalDescription
															}
														</p>
														{expense.vendor && (
															<p className="text-muted-foreground text-xs">
																{expense.vendor}
															</p>
														)}
													</td>
													<td className="p-3">
														<Badge status="info">
															{categoryLabels[
																expense.category
															] ??
																expense.category}
														</Badge>
													</td>
													<td className="p-3 text-right font-medium">
														$
														{expense.amount.toFixed(
															2,
														)}
													</td>
													<td className="p-3 text-center">
														{expense.taxInfo
															.isDeductible ? (
															<CheckCircleIcon className="mx-auto size-5 text-green-500" />
														) : (
															<span className="text-muted-foreground">
																—
															</span>
														)}
													</td>
													<td className="p-3 text-right">
														<span
															className={cn(
																expense.confidence >=
																	0.8
																	? "text-green-500"
																	: expense.confidence >=
																		  0.5
																		? "text-yellow-500"
																		: "text-red-500",
															)}
														>
															{Math.round(
																expense.confidence *
																	100,
															)}
															%
														</span>
													</td>
												</tr>
											),
										)}
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>

					{result.taxInsights.potentialRedFlags.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<AlertTriangleIcon className="size-5 text-orange-500" />
									Potential Red Flags
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{result.taxInsights.potentialRedFlags.map(
										(flag, index) => (
											<div
												key={index}
												className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20"
											>
												<p className="font-medium">
													{flag.expense}
												</p>
												<p className="text-muted-foreground text-sm">
													{flag.reason}
												</p>
												<p className="mt-1 text-sm">
													<span className="font-medium">
														Recommendation:
													</span>{" "}
													{flag.recommendation}
												</p>
											</div>
										),
									)}
								</div>
							</CardContent>
						</Card>
					)}

					{result.taxInsights.optimizationSuggestions.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Optimization Suggestions</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className="space-y-2">
									{result.taxInsights.optimizationSuggestions.map(
										(suggestion, index) => (
											<li
												key={index}
												className="flex items-start gap-2 text-sm"
											>
												<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
												{suggestion}
											</li>
										),
									)}
								</ul>
							</CardContent>
						</Card>
					)}

					<Button onClick={handleNewAnalysis} variant="outline">
						Categorize More Expenses
					</Button>
				</div>
			)}
		</div>
	);
}
