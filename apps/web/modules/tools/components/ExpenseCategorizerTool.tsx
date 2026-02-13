"use client";

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
	DownloadIcon,
	FileSpreadsheetIcon,
	LightbulbIcon,
	PlusIcon,
	ReceiptIcon,
	TrashIcon,
	TrendingUpIcon,
	UploadIcon,
	WalletIcon,
	XIcon,
} from "lucide-react";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateJob } from "../hooks/use-job-polling";
import {
	type ColumnMapping,
	type DetectedMapping,
	detectColumnMappings,
	type ExpenseField,
	exportToCSV,
	type ParsedExpense,
	type ParseResult,
	parseExpenseFile,
	transformToExpenses,
	validateExpenseFile,
} from "../lib/expense-file-parser";
import { JobProgressIndicator } from "./JobProgressIndicator";

// ============================================================================
// Helper Components
// ============================================================================

// Deduction percentage ring visualization
function DeductionRing({ percentage }: { percentage: number }) {
	const circumference = 2 * Math.PI * 40;
	const strokeDashoffset = circumference - (percentage / 100) * circumference;

	return (
		<div className="relative flex size-28 items-center justify-center">
			<svg
				className="-rotate-90 size-28"
				aria-labelledby="deduction-ring-title"
			>
				<title id="deduction-ring-title">
					Deduction: {Math.round(percentage)}%
				</title>
				<circle
					cx="56"
					cy="56"
					r="40"
					fill="none"
					strokeWidth="8"
					className="stroke-muted"
				/>
				<circle
					cx="56"
					cy="56"
					r="40"
					fill="none"
					strokeWidth="8"
					strokeLinecap="round"
					className="stroke-emerald-500"
					style={{
						strokeDasharray: circumference,
						strokeDashoffset,
						transition: "stroke-dashoffset 0.5s ease-in-out",
					}}
				/>
			</svg>
			<div className="absolute inset-0 flex flex-col items-center justify-center">
				<span className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">
					{Math.round(percentage)}%
				</span>
				<span className="text-muted-foreground text-xs">
					Deductible
				</span>
			</div>
		</div>
	);
}

// Category breakdown bar
function CategoryBar({
	category,
	amount,
	total,
	deductible,
}: {
	category: string;
	amount: number;
	total: number;
	deductible: number;
}) {
	const percentage = (amount / total) * 100;
	const deductiblePercentage = (deductible / amount) * 100;

	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between text-sm">
				<span className="font-medium">{category}</span>
				<span className="text-muted-foreground">
					$
					{amount.toLocaleString(undefined, {
						minimumFractionDigits: 2,
					})}
				</span>
			</div>
			<div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
				<div
					className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
					style={{ width: `${percentage}%` }}
				/>
			</div>
			<div className="flex justify-between text-muted-foreground text-xs">
				<span>{percentage.toFixed(1)}% of total</span>
				<span className="text-emerald-600 dark:text-emerald-400">
					{deductiblePercentage.toFixed(0)}% deductible
				</span>
			</div>
		</div>
	);
}

// Confidence badge with visual indicator
function ConfidenceBadge({ confidence }: { confidence: number }) {
	const percentage = Math.round(confidence * 100);
	const color =
		confidence >= 0.8
			? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
			: confidence >= 0.5
				? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
				: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-xs",
				color,
			)}
		>
			<span
				className={cn(
					"size-1.5 rounded-full",
					confidence >= 0.8
						? "bg-emerald-500"
						: confidence >= 0.5
							? "bg-amber-500"
							: "bg-red-500",
				)}
			/>
			{percentage}%
		</span>
	);
}

// ============================================================================
// Column Mapping Component
// ============================================================================

interface ColumnMappingProps {
	headers: string[];
	detectedMapping: DetectedMapping;
	onMappingChange: (mappings: ColumnMapping[]) => void;
	onConfirm: () => void;
	onCancel: () => void;
}

const EXPENSE_FIELDS: { value: ExpenseField; label: string }[] = [
	{ value: "description", label: "Description" },
	{ value: "amount", label: "Amount" },
	{ value: "date", label: "Date" },
	{ value: "vendor", label: "Vendor/Merchant" },
	{ value: "category", label: "Category (optional)" },
];

function ColumnMappingUI({
	headers,
	detectedMapping,
	onMappingChange,
	onConfirm,
	onCancel,
}: ColumnMappingProps) {
	const [mappings, setMappings] = useState<ColumnMapping[]>(
		detectedMapping.mappings,
	);

	const getMappedField = (header: string): ExpenseField | "" => {
		const mapping = mappings.find((m) => m.sourceColumn === header);
		return mapping?.targetField ?? "";
	};

	const handleFieldChange = (header: string, field: ExpenseField | "") => {
		let newMappings = mappings.filter((m) => m.sourceColumn !== header);

		if (field) {
			// Remove any existing mapping for this field
			newMappings = newMappings.filter((m) => m.targetField !== field);
			newMappings.push({ sourceColumn: header, targetField: field });
		}

		setMappings(newMappings);
		onMappingChange(newMappings);
	};

	const hasRequiredMappings =
		mappings.some((m) => m.targetField === "description") &&
		mappings.some((m) => m.targetField === "amount");

	return (
		<Card className="overflow-hidden border-0 shadow-lg">
			<CardHeader className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent">
				<div className="flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-500/25">
						<FileSpreadsheetIcon className="size-5 text-white" />
					</div>
					<div>
						<CardTitle>Map Your Columns</CardTitle>
						<CardDescription className="mt-1">
							Match your file columns to expense fields.
							Description and Amount are required.
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent className="p-6">
				<div className="space-y-4">
					{headers.map((header) => {
						const confidence = detectedMapping.confidence[header];
						return (
							<div
								key={header}
								className="flex items-center gap-4 rounded-lg border p-3"
							>
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium">
										{header}
									</p>
									{confidence && (
										<p className="text-muted-foreground text-xs">
											{Math.round(confidence * 100)}%
											confidence
										</p>
									)}
								</div>
								<Select
									value={getMappedField(header)}
									onValueChange={(value) =>
										handleFieldChange(
											header,
											value as ExpenseField | "",
										)
									}
								>
									<SelectTrigger className="w-48">
										<SelectValue placeholder="Select field..." />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="">
											<span className="text-muted-foreground">
												Skip this column
											</span>
										</SelectItem>
										{EXPENSE_FIELDS.map((field) => {
											const isUsed = mappings.some(
												(m) =>
													m.targetField ===
														field.value &&
													m.sourceColumn !== header,
											);
											return (
												<SelectItem
													key={field.value}
													value={field.value}
													disabled={isUsed}
												>
													{field.label}
													{isUsed && " (in use)"}
												</SelectItem>
											);
										})}
									</SelectContent>
								</Select>
							</div>
						);
					})}
				</div>

				{!hasRequiredMappings && (
					<div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
						<AlertTriangleIcon className="mr-2 inline-block size-4" />
						Please map at least Description and Amount columns to
						continue.
					</div>
				)}

				<div className="mt-6 flex justify-end gap-3">
					<Button variant="outline" onClick={onCancel}>
						Cancel
					</Button>
					<Button
						onClick={onConfirm}
						disabled={!hasRequiredMappings}
						className="bg-emerald-600 hover:bg-emerald-700"
					>
						Continue with Mapping
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

// ============================================================================
// Preview Component
// ============================================================================

interface PreviewProps {
	expenses: ParsedExpense[];
	onConfirm: () => void;
	onBack: () => void;
	isSubmitting: boolean;
}

function ExpensePreview({
	expenses,
	onConfirm,
	onBack,
	isSubmitting,
}: PreviewProps) {
	const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

	return (
		<Card className="overflow-hidden border-0 shadow-lg">
			<CardHeader className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-500/25">
							<ReceiptIcon className="size-5 text-white" />
						</div>
						<div>
							<CardTitle>Review Imported Expenses</CardTitle>
							<CardDescription className="mt-1">
								{expenses.length} expenses found •{" "}
								<span className="font-semibold text-emerald-600">
									$
									{totalAmount.toLocaleString(undefined, {
										minimumFractionDigits: 2,
									})}
								</span>{" "}
								total
							</CardDescription>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent className="p-0">
				<div className="max-h-[400px] overflow-auto">
					<table className="w-full text-sm">
						<thead className="sticky top-0 border-b bg-muted/50">
							<tr>
								<th className="p-3 text-left font-semibold">
									Description
								</th>
								<th className="p-3 text-right font-semibold">
									Amount
								</th>
								<th className="p-3 text-left font-semibold">
									Date
								</th>
								<th className="p-3 text-left font-semibold">
									Vendor
								</th>
							</tr>
						</thead>
						<tbody>
							{expenses.slice(0, 100).map((expense, index) => (
								<tr
									key={index}
									className="border-b transition-colors last:border-0 hover:bg-muted/30"
								>
									<td className="p-3">
										{expense.description}
									</td>
									<td className="p-3 text-right font-medium">
										${expense.amount.toFixed(2)}
									</td>
									<td className="p-3 text-muted-foreground">
										{expense.date ?? "—"}
									</td>
									<td className="p-3 text-muted-foreground">
										{expense.vendor ?? "—"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				{expenses.length > 100 && (
					<div className="border-t p-3 text-center text-muted-foreground text-sm">
						Showing first 100 of {expenses.length} expenses
					</div>
				)}
				<div className="flex justify-end gap-3 border-t p-4">
					<Button variant="outline" onClick={onBack}>
						Back to Mapping
					</Button>
					<Button
						onClick={onConfirm}
						loading={isSubmitting}
						className="bg-emerald-600 hover:bg-emerald-700"
					>
						Categorize {expenses.length} Expenses
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

// ============================================================================
// Form Schema
// ============================================================================

const expenseItemSchema = z.object({
	description: z.string().min(1, "Description is required"),
	amount: z.number().positive("Amount must be positive"),
	date: z.string().optional(),
	vendor: z.string().optional(),
});

const formSchema = z.object({
	expenses: z
		.array(expenseItemSchema)
		.min(1, "At least one expense is required"),
	businessType: z.string().optional(),
	taxYear: z.number().optional(),
	country: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Main Component
// ============================================================================

type InputMode = "form" | "text" | "file";
type FileStep = "upload" | "mapping" | "preview";

export function ExpenseCategorizerTool() {
	const [jobId, setJobId] = useState<string | null>(null);
	const [result, setResult] = useState<ExpenseOutput | null>(null);
	const [inputMode, setInputMode] = useState<InputMode>("form");
	const [bulkText, setBulkText] = useState("");
	const createJobMutation = useCreateJob();

	// File upload state
	const [fileStep, setFileStep] = useState<FileStep>("upload");
	const [uploadedFile, setUploadedFile] = useState<File | null>(null);
	const [parseResult, setParseResult] = useState<ParseResult | null>(null);
	const [detectedMapping, setDetectedMapping] =
		useState<DetectedMapping | null>(null);
	const [currentMappings, setCurrentMappings] = useState<ColumnMapping[]>([]);
	const [parsedExpenses, setParsedExpenses] = useState<ParsedExpense[]>([]);
	const [fileError, setFileError] = useState<string | null>(null);

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

	// File dropzone
	const onDrop = useCallback(async (acceptedFiles: File[]) => {
		const file = acceptedFiles[0];
		if (!file) {
			return;
		}

		setFileError(null);

		// Validate file
		const validation = validateExpenseFile(file);
		if (!validation.valid) {
			setFileError(validation.error ?? "Invalid file");
			return;
		}

		setUploadedFile(file);

		// Parse file
		const result = await parseExpenseFile(file);
		if (!result.success) {
			setFileError(result.error ?? "Failed to parse file");
			return;
		}

		if (result.data.length === 0) {
			setFileError("No data found in file");
			return;
		}

		setParseResult(result);

		// Detect column mappings
		const detected = detectColumnMappings(result.headers, result.data);
		setDetectedMapping(detected);
		setCurrentMappings(detected.mappings);

		// Move to mapping step
		setFileStep("mapping");
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"text/csv": [".csv"],
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
				[".xlsx"],
			"application/vnd.ms-excel": [".xls"],
		},
		maxFiles: 1,
	});

	const handleMappingConfirm = () => {
		if (!parseResult) {
			return;
		}

		const expenses = transformToExpenses(parseResult.data, currentMappings);
		if (expenses.length === 0) {
			setFileError(
				"No valid expenses found with the current mapping. Please check your column mappings.",
			);
			return;
		}

		setParsedExpenses(expenses);
		setFileStep("preview");
	};

	const handleFileSubmit = async () => {
		if (parsedExpenses.length === 0) {
			return;
		}

		setResult(null);
		try {
			const response = await createJobMutation.mutateAsync({
				toolSlug: "expense-categorizer",
				input: {
					expenses: parsedExpenses,
					businessType: form.getValues("businessType"),
					country: form.getValues("country"),
				},
			});
			setJobId(response.job.id);
		} catch (error) {
			console.error("Failed to create job:", error);
		}
	};

	const parseBulkText = () => {
		const lines = bulkText.split("\n").filter((line) => line.trim());
		const expenses: Array<{ description: string; amount: number }> = [];

		for (const line of lines) {
			const match = line.match(/(.+?)\s*[-:]\s*\$?([\d,]+\.?\d*)/);
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
		setUploadedFile(null);
		setParseResult(null);
		setDetectedMapping(null);
		setCurrentMappings([]);
		setParsedExpenses([]);
		setFileError(null);
		setFileStep("upload");
	};

	const handleExportCSV = () => {
		if (!result) {
			return;
		}

		const csv = exportToCSV(result.categorizedExpenses);
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `categorized-expenses-${new Date().toISOString().split("T")[0]}.csv`;
		link.click();
		URL.revokeObjectURL(url);
	};

	const resetFileUpload = () => {
		setUploadedFile(null);
		setParseResult(null);
		setDetectedMapping(null);
		setCurrentMappings([]);
		setParsedExpenses([]);
		setFileError(null);
		setFileStep("upload");
	};

	// ========================================================================
	// Render
	// ========================================================================

	return (
		<div className="space-y-6">
			{/* Input Form - Show when no job is running */}
			{!jobId && (
				<>
					{/* File Upload Mode - Mapping Step */}
					{inputMode === "file" && fileStep === "mapping" && (
						<ColumnMappingUI
							headers={parseResult?.headers ?? []}
							detectedMapping={
								detectedMapping ?? {
									mappings: [],
									confidence: {},
									unmappedColumns: [],
								}
							}
							onMappingChange={setCurrentMappings}
							onConfirm={handleMappingConfirm}
							onCancel={resetFileUpload}
						/>
					)}

					{/* File Upload Mode - Preview Step */}
					{inputMode === "file" && fileStep === "preview" && (
						<ExpensePreview
							expenses={parsedExpenses}
							onConfirm={handleFileSubmit}
							onBack={() => setFileStep("mapping")}
							isSubmitting={createJobMutation.isPending}
						/>
					)}

					{/* Main Input Card - Show for upload step or other modes */}
					{(inputMode !== "file" || fileStep === "upload") && (
						<Card className="overflow-hidden border-0 shadow-lg">
							<div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-6 pb-0">
								<div className="flex items-start gap-4">
									<div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-500/25">
										<WalletIcon className="size-7 text-white" />
									</div>
									<div className="flex-1">
										<CardTitle className="text-xl">
											Expense Categorizer
										</CardTitle>
										<CardDescription className="mt-1">
											Automatically categorize business
											expenses for tax deductions and
											accounting
										</CardDescription>
									</div>
								</div>
							</div>
							<CardContent className="p-6">
								{/* Mode Toggle */}
								<div className="mb-6 inline-flex rounded-xl bg-muted/50 p-1">
									<Button
										type="button"
										variant={
											inputMode === "form"
												? "secondary"
												: "ghost"
										}
										size="sm"
										className={cn(
											"rounded-lg px-4",
											inputMode === "form" &&
												"bg-background shadow-sm",
										)}
										onClick={() => setInputMode("form")}
									>
										<ReceiptIcon className="mr-2 size-4" />
										Form Entry
									</Button>
									<Button
										type="button"
										variant={
											inputMode === "text"
												? "secondary"
												: "ghost"
										}
										size="sm"
										className={cn(
											"rounded-lg px-4",
											inputMode === "text" &&
												"bg-background shadow-sm",
										)}
										onClick={() => setInputMode("text")}
									>
										Bulk Text
									</Button>
									<Button
										type="button"
										variant={
											inputMode === "file"
												? "secondary"
												: "ghost"
										}
										size="sm"
										className={cn(
											"rounded-lg px-4",
											inputMode === "file" &&
												"bg-background shadow-sm",
										)}
										onClick={() => setInputMode("file")}
									>
										<UploadIcon className="mr-2 size-4" />
										File Upload
									</Button>
								</div>

								{/* File Upload Mode */}
								{inputMode === "file" && (
									<div className="space-y-4">
										{uploadedFile ? (
											<div className="flex items-center justify-between rounded-xl border-2 border-emerald-500 bg-emerald-50 p-4 dark:bg-emerald-900/20">
												<div className="flex items-center gap-3">
													<FileSpreadsheetIcon className="size-8 text-emerald-600" />
													<div>
														<p className="font-medium">
															{uploadedFile.name}
														</p>
														<p className="text-muted-foreground text-sm">
															{(
																uploadedFile.size /
																1024
															).toFixed(1)}{" "}
															KB
														</p>
													</div>
												</div>
												<Button
													variant="ghost"
													size="icon"
													onClick={resetFileUpload}
												>
													<XIcon className="size-4" />
												</Button>
											</div>
										) : (
											<div
												{...getRootProps()}
												className={cn(
													"cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors",
													isDragActive
														? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
														: "border-muted-foreground/25 hover:border-emerald-500/50 hover:bg-muted/30",
												)}
											>
												<input {...getInputProps()} />
												<UploadIcon className="mx-auto size-12 text-muted-foreground" />
												<p className="mt-4 font-medium">
													{isDragActive
														? "Drop your file here..."
														: "Drag & drop a CSV or Excel file"}
												</p>
												<p className="mt-1 text-muted-foreground text-sm">
													or click to browse (max 5MB)
												</p>
												<p className="mt-3 text-muted-foreground text-xs">
													Supports: .csv, .xlsx, .xls
												</p>
											</div>
										)}

										{fileError && (
											<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 text-sm dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
												<AlertTriangleIcon className="mr-2 inline-block size-4" />
												{fileError}
											</div>
										)}

										{/* Business context fields for file upload */}
										<div className="grid gap-4 pt-4 md:grid-cols-2">
											<FormField
												control={form.control}
												name="businessType"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="font-semibold">
															Business Type
															(Optional)
														</FormLabel>
														<FormControl>
															<Input
																placeholder="e.g., Consulting, Retail, SaaS"
																className="rounded-xl border-2 bg-muted/30 transition-colors focus:border-emerald-500 focus:bg-background"
																{...field}
															/>
														</FormControl>
														<FormDescription>
															Helps with more
															accurate
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
														<FormLabel className="font-semibold">
															Country
														</FormLabel>
														<Select
															onValueChange={
																field.onChange
															}
															defaultValue={
																field.value
															}
														>
															<FormControl>
																<SelectTrigger className="rounded-xl border-2 bg-muted/30 transition-colors focus:border-emerald-500 focus:bg-background">
																	<SelectValue placeholder="Select country" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="US">
																	United
																	States
																</SelectItem>
																<SelectItem value="CA">
																	Canada
																</SelectItem>
																<SelectItem value="UK">
																	United
																	Kingdom
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
									</div>
								)}

								{/* Bulk Text Mode */}
								{inputMode === "text" && (
									<div className="space-y-4">
										<div>
											<label
												htmlFor="bulk-expenses"
												className="mb-2 block font-semibold text-sm"
											>
												Paste Expenses
											</label>
											<Textarea
												id="bulk-expenses"
												placeholder="Office supplies - $45.99&#10;Software subscription - $29.99&#10;Client lunch: $85.00"
												className="min-h-[200px] rounded-xl border-2 bg-muted/30 font-mono text-sm transition-colors focus:border-emerald-500 focus:bg-background"
												value={bulkText}
												onChange={(e) =>
													setBulkText(e.target.value)
												}
											/>
											<p className="mt-2 text-muted-foreground text-sm">
												Enter one expense per line with
												amount (e.g., "Description -
												$amount")
											</p>
										</div>
										<Button
											type="button"
											onClick={parseBulkText}
											className="h-12 w-full rounded-xl bg-emerald-600 font-semibold shadow-lg shadow-emerald-500/25 hover:bg-emerald-700"
										>
											Parse Expenses
										</Button>
									</div>
								)}

								{/* Form Entry Mode */}
								{inputMode === "form" && (
									<Form {...form}>
										<form
											onSubmit={form.handleSubmit(
												onSubmit,
											)}
											className="space-y-6"
										>
											<div className="space-y-3">
												{fields.map((field, index) => (
													<div
														key={field.id}
														className="group flex items-end gap-3 rounded-xl border-2 border-dashed border-muted bg-muted/20 p-3 transition-colors hover:border-emerald-500/30 hover:bg-muted/30"
													>
														<FormField
															control={
																form.control
															}
															name={`expenses.${index}.description`}
															render={({
																field,
															}) => (
																<FormItem className="flex-1">
																	{index ===
																		0 && (
																		<FormLabel className="font-semibold">
																			Description
																		</FormLabel>
																	)}
																	<FormControl>
																		<Input
																			placeholder="Office supplies"
																			className="rounded-lg border-0 bg-background shadow-sm"
																			{...field}
																		/>
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>
														<FormField
															control={
																form.control
															}
															name={`expenses.${index}.amount`}
															render={({
																field,
															}) => (
																<FormItem className="w-36">
																	{index ===
																		0 && (
																		<FormLabel className="font-semibold">
																			Amount
																		</FormLabel>
																	)}
																	<FormControl>
																		<div className="relative">
																			<DollarSignIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-emerald-600" />
																			<Input
																				type="number"
																				step="0.01"
																				placeholder="0.00"
																				className="rounded-lg border-0 bg-background pl-8 shadow-sm"
																				value={
																					field.value
																				}
																				onChange={(
																					e,
																				) =>
																					field.onChange(
																						e
																							.target
																							.value
																							? Number.parseFloat(
																									e
																										.target
																										.value,
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
																className="size-10 shrink-0 rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-red-100 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/20"
																onClick={() =>
																	remove(
																		index,
																	)
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
												className="rounded-lg border-dashed"
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
															<FormLabel className="font-semibold">
																Business Type
																(Optional)
															</FormLabel>
															<FormControl>
																<Input
																	placeholder="e.g., Consulting, Retail, SaaS"
																	className="rounded-xl border-2 bg-muted/30 transition-colors focus:border-emerald-500 focus:bg-background"
																	{...field}
																/>
															</FormControl>
															<FormDescription>
																Helps with more
																accurate
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
															<FormLabel className="font-semibold">
																Country
															</FormLabel>
															<Select
																onValueChange={
																	field.onChange
																}
																defaultValue={
																	field.value
																}
															>
																<FormControl>
																	<SelectTrigger className="rounded-xl border-2 bg-muted/30 transition-colors focus:border-emerald-500 focus:bg-background">
																		<SelectValue placeholder="Select country" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	<SelectItem value="US">
																		United
																		States
																	</SelectItem>
																	<SelectItem value="CA">
																		Canada
																	</SelectItem>
																	<SelectItem value="UK">
																		United
																		Kingdom
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
												loading={
													form.formState.isSubmitting
												}
												className="h-12 w-full rounded-xl bg-emerald-600 font-semibold shadow-lg shadow-emerald-500/25 hover:bg-emerald-700"
											>
												Categorize Expenses
											</Button>
										</form>
									</Form>
								)}
							</CardContent>
						</Card>
					)}
				</>
			)}

			{/* Job Progress */}
			{jobId && !result && (
				<JobProgressIndicator
					jobId={jobId}
					title="Categorizing Expenses"
					description="AI is analyzing and categorizing your expenses..."
					onComplete={handleComplete}
				/>
			)}

			{/* Results */}
			{result && (
				<div className="space-y-6">
					{/* Summary Overview */}
					<Card className="overflow-hidden border-0 shadow-lg">
						<div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-6">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="flex size-12 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-500/25">
										<TrendingUpIcon className="size-6 text-white" />
									</div>
									<div>
										<h3 className="font-semibold text-lg">
											Expense Summary
										</h3>
										<p className="text-muted-foreground text-sm">
											{result.categorizedExpenses.length}{" "}
											expenses analyzed
										</p>
									</div>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={handleExportCSV}
									className="rounded-lg"
								>
									<DownloadIcon className="mr-2 size-4" />
									Export CSV
								</Button>
							</div>
						</div>
						<CardContent className="p-6">
							<div className="grid gap-6 md:grid-cols-4">
								{/* Deduction Ring */}
								<div className="flex justify-center md:col-span-1">
									<DeductionRing
										percentage={
											result.summary.totalAmount > 0
												? (result.summary
														.totalDeductible /
														result.summary
															.totalAmount) *
													100
												: 0
										}
									/>
								</div>

								{/* Stats */}
								<div className="grid gap-4 md:col-span-3 md:grid-cols-3">
									<div className="rounded-xl bg-muted/30 p-4 text-center">
										<p className="mb-1 text-muted-foreground text-sm">
											Total Expenses
										</p>
										<p className="font-bold text-2xl">
											$
											{result.summary.totalAmount.toLocaleString(
												undefined,
												{ minimumFractionDigits: 2 },
											)}
										</p>
									</div>
									<div className="rounded-xl bg-emerald-50 p-4 text-center dark:bg-emerald-900/20">
										<p className="mb-1 text-emerald-600 text-sm dark:text-emerald-400">
											Deductible
										</p>
										<p className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">
											$
											{result.summary.totalDeductible.toLocaleString(
												undefined,
												{ minimumFractionDigits: 2 },
											)}
										</p>
									</div>
									<div className="rounded-xl bg-red-50 p-4 text-center dark:bg-red-900/20">
										<p className="mb-1 text-red-600 text-sm dark:text-red-400">
											Non-Deductible
										</p>
										<p className="font-bold text-2xl text-red-600 dark:text-red-400">
											$
											{result.summary.totalNonDeductible.toLocaleString(
												undefined,
												{ minimumFractionDigits: 2 },
											)}
										</p>
									</div>
								</div>
							</div>

							{/* Category Breakdown */}
							{result.summary.categoryBreakdown.length > 0 && (
								<div className="mt-6 border-t pt-6">
									<h4 className="mb-4 font-semibold text-sm">
										Category Breakdown
									</h4>
									<div className="grid gap-4 md:grid-cols-2">
										{result.summary.categoryBreakdown
											.slice(0, 6)
											.map((cat) => (
												<CategoryBar
													key={cat.category}
													category={
														categoryLabels[
															cat.category
														] ?? cat.category
													}
													amount={cat.amount}
													total={
														result.summary
															.totalAmount
													}
													deductible={
														cat.deductibleAmount
													}
												/>
											))}
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Categorized Expenses Table */}
					<Card className="overflow-hidden border-0 shadow-lg">
						<CardHeader className="border-b bg-muted/30">
							<div className="flex items-center gap-3">
								<div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
									<ReceiptIcon className="size-5 text-emerald-600 dark:text-emerald-400" />
								</div>
								<CardTitle>Categorized Expenses</CardTitle>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead className="border-b bg-muted/30">
										<tr>
											<th className="p-4 text-left font-semibold">
												Description
											</th>
											<th className="p-4 text-left font-semibold">
												Category
											</th>
											<th className="p-4 text-right font-semibold">
												Amount
											</th>
											<th className="p-4 text-center font-semibold">
												Deductible
											</th>
											<th className="p-4 text-right font-semibold">
												Confidence
											</th>
										</tr>
									</thead>
									<tbody>
										{result.categorizedExpenses.map(
											(expense, index) => (
												<tr
													key={index}
													className="border-b transition-colors last:border-0 hover:bg-muted/30"
												>
													<td className="p-4">
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
													<td className="p-4">
														<Badge className="rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
															{categoryLabels[
																expense.category
															] ??
																expense.category}
														</Badge>
													</td>
													<td className="p-4 text-right font-semibold">
														$
														{expense.amount.toFixed(
															2,
														)}
													</td>
													<td className="p-4 text-center">
														{expense.taxInfo
															.isDeductible ? (
															<div className="mx-auto flex size-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
																<CheckCircleIcon className="size-4 text-emerald-600" />
															</div>
														) : (
															<span className="text-muted-foreground">
																—
															</span>
														)}
													</td>
													<td className="p-4 text-right">
														<ConfidenceBadge
															confidence={
																expense.confidence
															}
														/>
													</td>
												</tr>
											),
										)}
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>

					{/* Red Flags */}
					{result.taxInsights.potentialRedFlags.length > 0 && (
						<Card className="overflow-hidden border-0 border-l-4 border-l-amber-500 shadow-lg">
							<CardHeader className="bg-amber-50/50 dark:bg-amber-900/10">
								<div className="flex items-center gap-3">
									<div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
										<AlertTriangleIcon className="size-5 text-amber-600" />
									</div>
									<CardTitle>Potential Red Flags</CardTitle>
								</div>
							</CardHeader>
							<CardContent className="p-6">
								<div className="space-y-4">
									{result.taxInsights.potentialRedFlags.map(
										(flag, index) => (
											<div
												key={index}
												className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20"
											>
												<p className="font-semibold">
													{flag.expense}
												</p>
												<p className="mt-1 text-muted-foreground text-sm">
													{flag.reason}
												</p>
												<div className="mt-3 flex items-start gap-2 rounded-lg bg-white/50 p-3 dark:bg-white/5">
													<LightbulbIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
													<p className="text-sm">
														{flag.recommendation}
													</p>
												</div>
											</div>
										),
									)}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Optimization Suggestions */}
					{result.taxInsights.optimizationSuggestions.length > 0 && (
						<Card className="overflow-hidden border-0 shadow-lg">
							<CardHeader className="border-b bg-muted/30">
								<div className="flex items-center gap-3">
									<div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
										<LightbulbIcon className="size-5 text-blue-600 dark:text-blue-400" />
									</div>
									<CardTitle>
										Optimization Suggestions
									</CardTitle>
								</div>
							</CardHeader>
							<CardContent className="p-6">
								<ul className="space-y-3">
									{result.taxInsights.optimizationSuggestions.map(
										(suggestion, index) => (
											<li
												key={index}
												className="flex items-start gap-3 rounded-xl bg-blue-50 p-4 text-sm dark:bg-blue-900/20"
											>
												<div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-200 font-semibold text-blue-700 text-xs dark:bg-blue-800 dark:text-blue-300">
													{index + 1}
												</div>
												<span>{suggestion}</span>
											</li>
										),
									)}
								</ul>
							</CardContent>
						</Card>
					)}

					<Button
						onClick={handleNewAnalysis}
						variant="outline"
						className="rounded-xl"
					>
						Categorize More Expenses
					</Button>
				</div>
			)}
		</div>
	);
}
