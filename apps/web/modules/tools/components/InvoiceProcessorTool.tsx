"use client";

import React from "react";
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
	BuildingIcon,
	CalendarIcon,
	CheckCircle2Icon,
	FileSpreadsheetIcon,
	HashIcon,
	MailIcon,
	MapPinIcon,
	PhoneIcon,
	ReceiptIcon,
	RefreshCwIcon,
	SparklesIcon,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateJob } from "../hooks/use-job-polling";
import { JobProgressIndicator } from "./JobProgressIndicator";

const formSchema = z.object({
	invoiceText: z.string().min(1, "Invoice text is required"),
	outputFormat: z.enum(["json", "csv", "quickbooks", "xero"]),
});

type FormValues = z.infer<typeof formSchema>;

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
		if (percentage >= 80) return { color: "bg-emerald-500", label: "High" };
		if (percentage >= 50) return { color: "bg-amber-500", label: "Medium" };
		return { color: "bg-red-500", label: "Low" };
	};
	const status = getStatus();

	return (
		<div className="flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5">
			<div className={cn("size-2 rounded-full", status.color)} />
			<span className="font-medium text-sm">{percentage}%</span>
			<span className="text-muted-foreground text-xs">{status.label} confidence</span>
		</div>
	);
}

export function InvoiceProcessorTool() {
	const [jobId, setJobId] = useState<string | null>(null);
	const [result, setResult] = useState<InvoiceOutput | null>(null);
	const createJobMutation = useCreateJob();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			invoiceText: "",
			outputFormat: "json",
		},
	});

	const onSubmit = async (values: FormValues) => {
		setResult(null);
		try {
			const response = await createJobMutation.mutateAsync({
				toolSlug: "invoice-processor",
				input: values,
			});
			setJobId(response.job.id);
		} catch (error) {
			console.error("Failed to create job:", error);
		}
	};

	const handleComplete = (output: Record<string, unknown>) => {
		setResult(output as unknown as InvoiceOutput);
	};

	const handleNewInvoice = () => {
		setJobId(null);
		setResult(null);
		form.reset();
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
								<h2 className="font-bold text-2xl tracking-tight">Invoice Processor</h2>
								<p className="mt-1 text-muted-foreground">
									Extract structured data from invoices using AI for seamless accounting integration
								</p>
							</div>
						</div>
					</div>
					<CardContent className="p-6 pt-8">
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
												Paste the text content of your invoice. You can copy from PDFs, emails, or any text source.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="outputFormat"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="font-semibold text-base">Output Format</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger className="rounded-xl border-2 bg-muted/30 transition-colors focus:border-primary focus:bg-background">
														<SelectValue placeholder="Select output format" />
													</SelectTrigger>
												</FormControl>
												<SelectContent className="rounded-xl">
													{Object.entries(formatLabels).map(([value, label]) => {
														const Icon = formatIcons[value as keyof typeof formatIcons];
														return (
															<SelectItem key={value} value={value} className="rounded-lg">
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
												Choose the format for exported data
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<Button
									type="submit"
									variant="primary"
									loading={form.formState.isSubmitting}
									className="h-12 w-full rounded-xl font-semibold text-base shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
								>
									<SparklesIcon className="mr-2 size-5" />
									Process Invoice
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
					title="Processing Invoice"
					description="AI is extracting data from your invoice..."
					onComplete={handleComplete}
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
										<h3 className="font-bold text-xl">Invoice Extracted Successfully</h3>
										<p className="text-muted-foreground">All data has been parsed and structured</p>
									</div>
								</div>
								<ConfidenceBadge confidence={result.confidence} />
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
									<p className="font-semibold text-lg">{result.vendor.name}</p>
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
											<p className="mt-1 font-semibold">{result.invoice.number}</p>
										</div>
									)}
									{result.invoice.date && (
										<div className="rounded-xl bg-muted/50 p-3">
											<p className="flex items-center gap-1.5 text-muted-foreground text-xs">
												<CalendarIcon className="size-3" />
												Invoice Date
											</p>
											<p className="mt-1 font-semibold">{result.invoice.date}</p>
										</div>
									)}
									{result.invoice.dueDate && (
										<div className="rounded-xl bg-amber-500/10 p-3">
											<p className="flex items-center gap-1.5 text-muted-foreground text-xs">
												<CalendarIcon className="size-3" />
												Due Date
											</p>
											<p className="mt-1 font-semibold text-amber-600">{result.invoice.dueDate}</p>
										</div>
									)}
									{result.invoice.purchaseOrderNumber && (
										<div className="rounded-xl bg-muted/50 p-3">
											<p className="text-muted-foreground text-xs">PO Number</p>
											<p className="mt-1 font-semibold">{result.invoice.purchaseOrderNumber}</p>
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
								<CardTitle className="text-lg">Line Items</CardTitle>
								<CardDescription>{result.lineItems.length} items extracted</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="overflow-hidden rounded-xl border">
									<table className="w-full">
										<thead className="border-b bg-muted/50">
											<tr>
												<th className="p-4 text-left font-semibold text-sm">Description</th>
												<th className="p-4 text-right font-semibold text-sm">Qty</th>
												<th className="p-4 text-right font-semibold text-sm">Unit Price</th>
												<th className="p-4 text-right font-semibold text-sm">Amount</th>
											</tr>
										</thead>
										<tbody>
											{result.lineItems.map((item, index) => (
												<tr
													key={index}
													className={cn(
														"border-b transition-colors last:border-0 hover:bg-muted/30",
														index % 2 === 0 ? "bg-transparent" : "bg-muted/20"
													)}
												>
													<td className="p-4 font-medium">{item.description}</td>
													<td className="p-4 text-right text-muted-foreground">
														{item.quantity ?? "—"}
													</td>
													<td className="p-4 text-right text-muted-foreground">
														{item.unitPrice
															? `${result.currency} ${item.unitPrice.toFixed(2)}`
															: "—"}
													</td>
													<td className="p-4 text-right font-semibold">
														{result.currency} {item.amount.toFixed(2)}
													</td>
												</tr>
											))}
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
											<span className="text-muted-foreground">Subtotal</span>
											<span className="font-medium">
												{result.currency} {result.totals.subtotal.toFixed(2)}
											</span>
										</div>
									)}
									{result.totals.discount !== null && (
										<div className="flex justify-between text-sm">
											<span className="text-muted-foreground">Discount</span>
											<span className="font-medium text-emerald-600">
												-{result.currency} {result.totals.discount.toFixed(2)}
											</span>
										</div>
									)}
									{result.totals.tax !== null && (
										<div className="flex justify-between text-sm">
											<span className="text-muted-foreground">
												Tax{result.totals.taxRate ? ` (${result.totals.taxRate})` : ""}
											</span>
											<span className="font-medium">
												{result.currency} {result.totals.tax.toFixed(2)}
											</span>
										</div>
									)}
									{result.totals.shipping !== null && (
										<div className="flex justify-between text-sm">
											<span className="text-muted-foreground">Shipping</span>
											<span className="font-medium">
												{result.currency} {result.totals.shipping.toFixed(2)}
											</span>
										</div>
									)}
									<div className="border-t pt-3">
										<div className="flex justify-between">
											<span className="font-semibold text-lg">Total</span>
											<span className="font-bold text-2xl text-primary">
												{result.currency} {result.totals.total.toFixed(2)}
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
