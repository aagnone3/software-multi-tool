"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
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
	BuildingIcon,
	CalendarIcon,
	CheckCircle2Icon,
	FileIcon,
	FileSpreadsheetIcon,
	FileTextIcon,
	HashIcon,
	ImageIcon,
	LoaderIcon,
	MailIcon,
	MapPinIcon,
	PhoneIcon,
	ReceiptIcon,
	RefreshCwIcon,
	ScanIcon,
	SparklesIcon,
	UploadIcon,
	XIcon,
} from "lucide-react";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { orpc } from "../../shared/lib/orpc-query-utils";
import { useCreateJob } from "../hooks/use-job-polling";
import { JobProgressIndicator } from "./JobProgressIndicator";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = {
	"application/pdf": [".pdf"],
	"image/jpeg": [".jpg", ".jpeg"],
	"image/png": [".png"],
	"image/tiff": [".tiff", ".tif"],
	"image/webp": [".webp"],
};

const formSchema = z.object({
	invoiceText: z.string().optional(),
	outputFormat: z.enum(["json", "csv", "quickbooks", "xero"]),
});

type FormValues = z.infer<typeof formSchema>;

type InputMode = "text" | "file";

interface FileData {
	file: File;
	preview?: string;
}

function getFileIcon(mimeType: string) {
	if (mimeType === "application/pdf") {
		return FileTextIcon;
	}
	if (mimeType.startsWith("image/")) {
		return ImageIcon;
	}
	return FileIcon;
}

interface LineItem {
	description: string;
	quantity: number | null;
	unitPrice: number | null;
	amount: number;
}

interface InvoiceOutput {
	vendor: {
		name: string;
		address: string | null;
		phone: string | null;
		email: string | null;
		taxId: string | null;
	};
	invoice: {
		number: string | null;
		date: string | null;
		dueDate: string | null;
		purchaseOrderNumber: string | null;
	};
	customer: {
		name: string | null;
		address: string | null;
	};
	lineItems: LineItem[];
	totals: {
		subtotal: number | null;
		tax: number | null;
		taxRate: string | null;
		discount: number | null;
		shipping: number | null;
		total: number;
	};
	paymentInfo: {
		terms: string | null;
		method: string | null;
		bankDetails: string | null;
	};
	currency: string;
	confidence: number;
	extractionMetadata?: {
		usedOcr: boolean;
		ocrConfidence?: number;
		fileType?: string;
	};
}

const formatIcons = {
	json: FileSpreadsheetIcon,
	csv: FileSpreadsheetIcon,
	quickbooks: BuildingIcon,
	xero: BuildingIcon,
};

const formatLabels = {
	json: "JSON",
	csv: "CSV",
	quickbooks: "QuickBooks",
	xero: "Xero",
};

function ConfidenceBadge({ confidence }: { confidence: number }) {
	const percentage = Math.round(confidence * 100);
	const getStatus = () => {
		if (percentage >= 80) {
			return { color: "bg-emerald-500", label: "High" };
		}
		if (percentage >= 50) {
			return { color: "bg-amber-500", label: "Medium" };
		}
		return { color: "bg-red-500", label: "Low" };
	};
	const status = getStatus();

	return (
		<div className="flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5">
			<div className={cn("size-2 rounded-full", status.color)} />
			<span className="font-medium text-sm">{percentage}%</span>
			<span className="text-muted-foreground text-xs">
				{status.label} confidence
			</span>
		</div>
	);
}

export function InvoiceProcessorTool() {
	const [jobId, setJobId] = useState<string | null>(null);
	const [result, setResult] = useState<InvoiceOutput | null>(null);
	const [inputMode, setInputMode] = useState<InputMode>("file");
	const [uploadedFile, setUploadedFile] = useState<FileData | null>(null);
	const [fileError, setFileError] = useState<string | null>(null);
	const [isProcessingFile, setIsProcessingFile] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<string | null>(null);
	const createJobMutation = useCreateJob();
	const getUploadUrlMutation = useMutation(
		orpc.invoiceProcessor.uploadUrl.mutationOptions(),
	);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			invoiceText: "",
			outputFormat: "json",
		},
	});

	// File dropzone handler
	const onDrop = useCallback((acceptedFiles: File[]) => {
		const file = acceptedFiles[0];
		if (!file) {
			return;
		}

		setFileError(null);

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			setFileError(
				`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed size (10MB)`,
			);
			return;
		}

		// Create preview for images
		let preview: string | undefined;
		if (file.type.startsWith("image/")) {
			preview = URL.createObjectURL(file);
		}

		setUploadedFile({ file, preview });
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: ACCEPTED_FILE_TYPES,
		maxFiles: 1,
		maxSize: MAX_FILE_SIZE,
		onDropRejected: (fileRejections) => {
			const rejection = fileRejections[0];
			if (rejection?.errors[0]?.code === "file-too-large") {
				setFileError("File size exceeds maximum allowed size (10MB)");
			} else if (rejection?.errors[0]?.code === "file-invalid-type") {
				setFileError(
					"Invalid file type. Please upload a PDF or image file (JPG, PNG, TIFF, WebP)",
				);
			} else {
				setFileError("Invalid file. Please try again.");
			}
		},
	});

	const onSubmit = async (values: FormValues) => {
		setResult(null);
		setUploadProgress(null);

		// Validate that we have either text or file
		if (inputMode === "text" && !values.invoiceText?.trim()) {
			form.setError("invoiceText", {
				message: "Invoice text is required",
			});
			return;
		}

		if (inputMode === "file" && !uploadedFile) {
			setFileError("Please upload an invoice file");
			return;
		}

		try {
			const input: Record<string, unknown> = {
				outputFormat: values.outputFormat,
			};

			if (inputMode === "text") {
				input.invoiceText = values.invoiceText;
			} else if (uploadedFile) {
				setIsProcessingFile(true);

				// Step 1: Get signed upload URL from API
				setUploadProgress("Getting upload URL...");
				const { signedUploadUrl, path, bucket } =
					await getUploadUrlMutation.mutateAsync({
						filename: uploadedFile.file.name,
						mimeType: uploadedFile.file.type,
					});

				// Step 2: Upload file directly to storage
				setUploadProgress("Uploading file...");
				const uploadResponse = await fetch(signedUploadUrl, {
					method: "PUT",
					body: uploadedFile.file,
					headers: {
						"Content-Type": uploadedFile.file.type,
						"x-upsert": "true",
					},
				});

				if (!uploadResponse.ok) {
					throw new Error(
						`Failed to upload file: ${uploadResponse.statusText}`,
					);
				}

				// Step 3: Set file reference for job (NOT base64 data)
				setUploadProgress("Creating job...");
				input.filePath = path;
				input.bucket = bucket;
				input.mimeType = uploadedFile.file.type;
			}

			const response = await createJobMutation.mutateAsync({
				toolSlug: "invoice-processor",
				input,
			});

			setJobId(response.job.id);
		} catch (error) {
			console.error("Failed to create job:", error);
			setFileError(
				error instanceof Error
					? error.message
					: "Failed to process invoice",
			);
		} finally {
			setIsProcessingFile(false);
			setUploadProgress(null);
		}
	};

	const handleComplete = (output: Record<string, unknown>) => {
		setResult(output as unknown as InvoiceOutput);
	};

	const handleError = (error: string) => {
		setFileError(error);
	};

	const handleNewInvoice = () => {
		setJobId(null);
		setResult(null);
		setUploadedFile(null);
		setFileError(null);
		setUploadProgress(null);
		form.reset();
	};

	const removeFile = () => {
		if (uploadedFile?.preview) {
			URL.revokeObjectURL(uploadedFile.preview);
		}
		setUploadedFile(null);
		setFileError(null);
	};

	return (
		<div className="mx-auto max-w-4xl space-y-8">
			{!jobId && (
				<Card className="overflow-hidden border-0 shadow-lg">
					<div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-0">
						<div className="flex items-start gap-4">
							<div className="flex size-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
								<ReceiptIcon className="size-7 text-primary-foreground" />
							</div>
							<div className="flex-1">
								<h2 className="font-bold text-2xl tracking-tight">
									Invoice Processor
								</h2>
								<p className="mt-1 text-muted-foreground">
									Extract structured data from invoices using
									AI for seamless accounting integration
								</p>
							</div>
						</div>
					</div>
					<CardContent className="p-6 pt-8">
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="space-y-6"
							>
								{/* Input Mode Toggle */}
								<div className="mb-6 inline-flex rounded-xl bg-muted/50 p-1">
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
										Upload File
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
										<FileTextIcon className="mr-2 size-4" />
										Paste Text
									</Button>
								</div>

								{/* File Upload Mode */}
								{inputMode === "file" && (
									<div className="space-y-4">
										{uploadedFile ? (
											<div className="relative rounded-xl border-2 border-primary bg-primary/5 p-4">
												<div className="flex items-center gap-4">
													{uploadedFile.preview ? (
														<div className="relative size-20 overflow-hidden rounded-lg border bg-muted">
															{/* biome-ignore lint/performance/noImgElement: Using img for data URL preview - Next/Image doesn't support data URLs well */}
															<img
																src={
																	uploadedFile.preview
																}
																alt="Invoice preview"
																className="size-full object-cover"
															/>
														</div>
													) : (
														<div className="flex size-20 items-center justify-center rounded-lg border bg-muted">
															{(() => {
																const Icon =
																	getFileIcon(
																		uploadedFile
																			.file
																			.type,
																	);
																return (
																	<Icon className="size-8 text-muted-foreground" />
																);
															})()}
														</div>
													)}
													<div className="flex-1 min-w-0">
														<p className="truncate font-medium">
															{
																uploadedFile
																	.file.name
															}
														</p>
														<p className="text-muted-foreground text-sm">
															{(
																uploadedFile
																	.file.size /
																1024
															).toFixed(1)}{" "}
															KB •{" "}
															{uploadedFile.file.type
																.split("/")[1]
																?.toUpperCase()}
														</p>
														<div className="mt-2 flex items-center gap-2 text-primary text-xs">
															<ScanIcon className="size-3" />
															{uploadedFile.file
																.type ===
															"application/pdf"
																? "PDF text extraction + OCR fallback"
																: "OCR text extraction"}
														</div>
													</div>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														className="shrink-0 rounded-lg hover:bg-destructive/10 hover:text-destructive"
														onClick={removeFile}
													>
														<XIcon className="size-4" />
													</Button>
												</div>
											</div>
										) : (
											<div
												{...getRootProps()}
												className={cn(
													"cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors",
													isDragActive
														? "border-primary bg-primary/5"
														: "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
												)}
											>
												<input {...getInputProps()} />
												<UploadIcon className="mx-auto size-12 text-muted-foreground" />
												<p className="mt-4 font-medium">
													{isDragActive
														? "Drop your invoice here..."
														: "Drag & drop an invoice file"}
												</p>
												<p className="mt-1 text-muted-foreground text-sm">
													or click to browse (max
													10MB)
												</p>
												<p className="mt-3 text-muted-foreground text-xs">
													Supports: PDF, JPG, PNG,
													TIFF, WebP
												</p>
												<div className="mt-4 flex flex-wrap items-center justify-center gap-2">
													<span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary text-xs">
														<FileTextIcon className="size-3" />
														Native PDF text
													</span>
													<span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary text-xs">
														<ScanIcon className="size-3" />
														OCR for scanned docs
													</span>
													<span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary text-xs">
														<ImageIcon className="size-3" />
														Image processing
													</span>
												</div>
											</div>
										)}

										{fileError && (
											<div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-destructive text-sm">
												<AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
												{fileError}
											</div>
										)}
									</div>
								)}

								{/* Text Input Mode */}
								{inputMode === "text" && (
									<FormField
										control={form.control}
										name="invoiceText"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="flex items-center gap-2 font-semibold text-base">
													<SparklesIcon className="size-4 text-primary" />
													Invoice Text
												</FormLabel>
												<FormControl>
													<Textarea
														placeholder="Paste your invoice text here..."
														className="min-h-[280px] resize-none rounded-xl border-2 bg-muted/30 font-mono text-sm transition-colors focus:border-primary focus:bg-background"
														{...field}
													/>
												</FormControl>
												<FormDescription className="text-muted-foreground/80">
													Paste the text content of
													your invoice. You can copy
													from PDFs, emails, or any
													text source.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}

								<FormField
									control={form.control}
									name="outputFormat"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="font-semibold text-base">
												Output Format
											</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger className="rounded-xl border-2 bg-muted/30 transition-colors focus:border-primary focus:bg-background">
														<SelectValue placeholder="Select output format" />
													</SelectTrigger>
												</FormControl>
												<SelectContent className="rounded-xl">
													{Object.entries(
														formatLabels,
													).map(([value, label]) => {
														const Icon =
															formatIcons[
																value as keyof typeof formatIcons
															];
														return (
															<SelectItem
																key={value}
																value={value}
																className="rounded-lg"
															>
																<div className="flex items-center gap-2">
																	<Icon className="size-4 text-muted-foreground" />
																	{label}
																</div>
															</SelectItem>
														);
													})}
												</SelectContent>
											</Select>
											<FormDescription className="text-muted-foreground/80">
												Choose the format for exported
												data
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<Button
									type="submit"
									variant="primary"
									loading={
										form.formState.isSubmitting ||
										isProcessingFile
									}
									disabled={
										inputMode === "file" && !uploadedFile
									}
									className="h-12 w-full rounded-xl font-semibold text-base shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
								>
									{isProcessingFile ? (
										<>
											<LoaderIcon className="mr-2 size-5 animate-spin" />
											{uploadProgress ?? "Processing..."}
										</>
									) : (
										<>
											<SparklesIcon className="mr-2 size-5" />
											Process Invoice
											<ArrowRightIcon className="ml-2 size-5" />
										</>
									)}
								</Button>
							</form>
						</Form>
					</CardContent>
				</Card>
			)}

			{jobId && !result && (
				<JobProgressIndicator
					jobId={jobId}
					title="Processing Invoice"
					description="AI is extracting data from your invoice..."
					onComplete={handleComplete}
					onError={handleError}
				/>
			)}

			{result && (
				<div className="space-y-6">
					{/* Success Header */}
					<Card className="overflow-hidden border-0 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent shadow-lg">
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									<div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/20">
										<CheckCircle2Icon className="size-6 text-emerald-600" />
									</div>
									<div>
										<h3 className="font-bold text-xl">
											Invoice Extracted Successfully
										</h3>
										<div className="flex items-center gap-2 text-muted-foreground">
											<span>
												All data has been parsed and
												structured
											</span>
											{result.extractionMetadata
												?.usedOcr && (
												<span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-blue-700 text-xs dark:bg-blue-900/30 dark:text-blue-400">
													<ScanIcon className="size-3" />
													OCR
												</span>
											)}
										</div>
									</div>
								</div>
								<ConfidenceBadge
									confidence={result.confidence}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Vendor & Invoice Details */}
					<div className="grid gap-6 lg:grid-cols-2">
						<Card className="border-0 shadow-md">
							<CardHeader className="pb-4">
								<CardTitle className="flex items-center gap-2 text-lg">
									<BuildingIcon className="size-5 text-primary" />
									Vendor Information
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="rounded-xl bg-muted/50 p-4">
									<p className="font-semibold text-lg">
										{result.vendor.name}
									</p>
									{result.vendor.address && (
										<p className="mt-2 flex items-start gap-2 text-muted-foreground text-sm">
											<MapPinIcon className="mt-0.5 size-4 shrink-0" />
											{result.vendor.address}
										</p>
									)}
									{result.vendor.email && (
										<p className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
											<MailIcon className="size-4" />
											{result.vendor.email}
										</p>
									)}
									{result.vendor.phone && (
										<p className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
											<PhoneIcon className="size-4" />
											{result.vendor.phone}
										</p>
									)}
								</div>
							</CardContent>
						</Card>

						<Card className="border-0 shadow-md">
							<CardHeader className="pb-4">
								<CardTitle className="flex items-center gap-2 text-lg">
									<ReceiptIcon className="size-5 text-primary" />
									Invoice Details
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 gap-4">
									{result.invoice.number && (
										<div className="rounded-xl bg-muted/50 p-3">
											<p className="flex items-center gap-1.5 text-muted-foreground text-xs">
												<HashIcon className="size-3" />
												Invoice Number
											</p>
											<p className="mt-1 font-semibold">
												{result.invoice.number}
											</p>
										</div>
									)}
									{result.invoice.date && (
										<div className="rounded-xl bg-muted/50 p-3">
											<p className="flex items-center gap-1.5 text-muted-foreground text-xs">
												<CalendarIcon className="size-3" />
												Invoice Date
											</p>
											<p className="mt-1 font-semibold">
												{result.invoice.date}
											</p>
										</div>
									)}
									{result.invoice.dueDate && (
										<div className="rounded-xl bg-amber-500/10 p-3">
											<p className="flex items-center gap-1.5 text-muted-foreground text-xs">
												<CalendarIcon className="size-3" />
												Due Date
											</p>
											<p className="mt-1 font-semibold text-amber-600">
												{result.invoice.dueDate}
											</p>
										</div>
									)}
									{result.invoice.purchaseOrderNumber && (
										<div className="rounded-xl bg-muted/50 p-3">
											<p className="text-muted-foreground text-xs">
												PO Number
											</p>
											<p className="mt-1 font-semibold">
												{
													result.invoice
														.purchaseOrderNumber
												}
											</p>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Line Items */}
					{result.lineItems.length > 0 && (
						<Card className="border-0 shadow-md">
							<CardHeader className="pb-4">
								<CardTitle className="text-lg">
									Line Items
								</CardTitle>
								<CardDescription>
									{result.lineItems.length} items extracted
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="overflow-hidden rounded-xl border">
									<table className="w-full">
										<thead className="border-b bg-muted/50">
											<tr>
												<th className="p-4 text-left font-semibold text-sm">
													Description
												</th>
												<th className="p-4 text-right font-semibold text-sm">
													Qty
												</th>
												<th className="p-4 text-right font-semibold text-sm">
													Unit Price
												</th>
												<th className="p-4 text-right font-semibold text-sm">
													Amount
												</th>
											</tr>
										</thead>
										<tbody>
											{result.lineItems.map(
												(item, index) => (
													<tr
														key={index}
														className={cn(
															"border-b transition-colors last:border-0 hover:bg-muted/30",
															index % 2 === 0
																? "bg-transparent"
																: "bg-muted/20",
														)}
													>
														<td className="p-4 font-medium">
															{item.description}
														</td>
														<td className="p-4 text-right text-muted-foreground">
															{item.quantity ??
																"—"}
														</td>
														<td className="p-4 text-right text-muted-foreground">
															{item.unitPrice
																? `${result.currency} ${item.unitPrice.toFixed(2)}`
																: "—"}
														</td>
														<td className="p-4 text-right font-semibold">
															{result.currency}{" "}
															{item.amount.toFixed(
																2,
															)}
														</td>
													</tr>
												),
											)}
										</tbody>
									</table>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Totals */}
					<Card className="border-0 shadow-md">
						<CardContent className="p-6">
							<div className="flex justify-end">
								<div className="w-full max-w-xs space-y-3">
									{result.totals.subtotal !== null && (
										<div className="flex justify-between text-sm">
											<span className="text-muted-foreground">
												Subtotal
											</span>
											<span className="font-medium">
												{result.currency}{" "}
												{result.totals.subtotal.toFixed(
													2,
												)}
											</span>
										</div>
									)}
									{result.totals.discount !== null && (
										<div className="flex justify-between text-sm">
											<span className="text-muted-foreground">
												Discount
											</span>
											<span className="font-medium text-emerald-600">
												-{result.currency}{" "}
												{result.totals.discount.toFixed(
													2,
												)}
											</span>
										</div>
									)}
									{result.totals.tax !== null && (
										<div className="flex justify-between text-sm">
											<span className="text-muted-foreground">
												Tax
												{result.totals.taxRate
													? ` (${result.totals.taxRate})`
													: ""}
											</span>
											<span className="font-medium">
												{result.currency}{" "}
												{result.totals.tax.toFixed(2)}
											</span>
										</div>
									)}
									{result.totals.shipping !== null && (
										<div className="flex justify-between text-sm">
											<span className="text-muted-foreground">
												Shipping
											</span>
											<span className="font-medium">
												{result.currency}{" "}
												{result.totals.shipping.toFixed(
													2,
												)}
											</span>
										</div>
									)}
									<div className="border-t pt-3">
										<div className="flex justify-between">
											<span className="font-semibold text-lg">
												Total
											</span>
											<span className="font-bold text-2xl text-primary">
												{result.currency}{" "}
												{result.totals.total.toFixed(2)}
											</span>
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Action Button */}
					<div className="flex justify-center pt-2">
						<Button
							onClick={handleNewInvoice}
							variant="outline"
							className="h-11 rounded-xl px-6"
						>
							<RefreshCwIcon className="mr-2 size-4" />
							Process Another Invoice
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
