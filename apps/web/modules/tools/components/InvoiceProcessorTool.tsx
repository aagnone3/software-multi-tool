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
import { ReceiptIcon } from "lucide-react";
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
		<div className="space-y-6">
			{!jobId && (
				<Card>
					<CardHeader>
						<div className="flex items-center gap-3">
							<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
								<ReceiptIcon className="size-5 text-primary" />
							</div>
							<div>
								<CardTitle>Invoice Processor</CardTitle>
								<CardDescription>
									Extract data from invoices using AI for easy
									accounting integration
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
									name="invoiceText"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Invoice Text</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Paste your invoice text here..."
													className="min-h-[200px] font-mono text-sm"
													{...field}
												/>
											</FormControl>
											<FormDescription>
												Paste the text content of your
												invoice. You can copy and paste
												from a PDF, email, or any other
												source.
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
											<FormLabel>Output Format</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select output format" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="json">
														JSON
													</SelectItem>
													<SelectItem value="csv">
														CSV
													</SelectItem>
													<SelectItem value="quickbooks">
														QuickBooks
													</SelectItem>
													<SelectItem value="xero">
														Xero
													</SelectItem>
												</SelectContent>
											</Select>
											<FormDescription>
												Choose the format for the
												extracted data
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
									Process Invoice
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
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2">
									<span
										className={cn(
											"inline-flex size-2 rounded-full",
											result.confidence >= 0.8
												? "bg-green-500"
												: result.confidence >= 0.5
													? "bg-yellow-500"
													: "bg-red-500",
										)}
									/>
									Invoice Extracted
								</CardTitle>
								<span className="text-muted-foreground text-sm">
									{Math.round(result.confidence * 100)}%
									confidence
								</span>
							</div>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid gap-6 md:grid-cols-2">
								<div>
									<h4 className="mb-2 font-semibold">
										Vendor
									</h4>
									<div className="space-y-1 text-sm">
										<p className="font-medium">
											{result.vendor.name}
										</p>
										{result.vendor.address && (
											<p className="text-muted-foreground">
												{result.vendor.address}
											</p>
										)}
										{result.vendor.email && (
											<p className="text-muted-foreground">
												{result.vendor.email}
											</p>
										)}
										{result.vendor.phone && (
											<p className="text-muted-foreground">
												{result.vendor.phone}
											</p>
										)}
									</div>
								</div>

								<div>
									<h4 className="mb-2 font-semibold">
										Invoice Details
									</h4>
									<div className="space-y-1 text-sm">
										{result.invoice.number && (
											<p>
												<span className="text-muted-foreground">
													Invoice #:
												</span>{" "}
												{result.invoice.number}
											</p>
										)}
										{result.invoice.date && (
											<p>
												<span className="text-muted-foreground">
													Date:
												</span>{" "}
												{result.invoice.date}
											</p>
										)}
										{result.invoice.dueDate && (
											<p>
												<span className="text-muted-foreground">
													Due:
												</span>{" "}
												{result.invoice.dueDate}
											</p>
										)}
									</div>
								</div>
							</div>

							{result.lineItems.length > 0 && (
								<div>
									<h4 className="mb-2 font-semibold">
										Line Items
									</h4>
									<div className="rounded-md border">
										<table className="w-full text-sm">
											<thead className="border-b bg-muted/50">
												<tr>
													<th className="p-2 text-left">
														Description
													</th>
													<th className="p-2 text-right">
														Qty
													</th>
													<th className="p-2 text-right">
														Unit Price
													</th>
													<th className="p-2 text-right">
														Amount
													</th>
												</tr>
											</thead>
											<tbody>
												{result.lineItems.map(
													(item, index) => (
														<tr
															key={index}
															className="border-b last:border-0"
														>
															<td className="p-2">
																{
																	item.description
																}
															</td>
															<td className="p-2 text-right">
																{item.quantity ??
																	"-"}
															</td>
															<td className="p-2 text-right">
																{item.unitPrice
																	? `${result.currency} ${item.unitPrice.toFixed(2)}`
																	: "-"}
															</td>
															<td className="p-2 text-right font-medium">
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
								</div>
							)}

							<div className="flex justify-end border-t pt-4">
								<div className="space-y-1 text-right text-sm">
									{result.totals.subtotal !== null && (
										<p>
											<span className="text-muted-foreground">
												Subtotal:
											</span>{" "}
											{result.currency}{" "}
											{result.totals.subtotal.toFixed(2)}
										</p>
									)}
									{result.totals.tax !== null && (
										<p>
											<span className="text-muted-foreground">
												Tax
												{result.totals.taxRate
													? ` (${result.totals.taxRate})`
													: ""}
												:
											</span>{" "}
											{result.currency}{" "}
											{result.totals.tax.toFixed(2)}
										</p>
									)}
									<p className="font-semibold text-base">
										<span className="text-muted-foreground">
											Total:
										</span>{" "}
										{result.currency}{" "}
										{result.totals.total.toFixed(2)}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Button onClick={handleNewInvoice} variant="outline">
						Process Another Invoice
					</Button>
				</div>
			)}
		</div>
	);
}
