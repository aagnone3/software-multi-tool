import { executePrompt } from "@repo/agent-sdk";
import type { ToolJob } from "@repo/database/prisma/generated/client";
import type { JobResult } from "../../jobs/lib/processor-registry";
import type { InvoiceProcessorInput, InvoiceProcessorOutput } from "../types";

const INVOICE_EXTRACTION_PROMPT = `You are an expert invoice data extraction system. Extract structured data from the following invoice text.

IMPORTANT: Return ONLY valid JSON with no additional text or explanation. The JSON must conform exactly to this schema:

{
  "vendor": {
    "name": "string (required)",
    "address": "string or null",
    "phone": "string or null",
    "email": "string or null",
    "taxId": "string or null"
  },
  "invoice": {
    "number": "string or null",
    "date": "string in YYYY-MM-DD format or null",
    "dueDate": "string in YYYY-MM-DD format or null",
    "purchaseOrderNumber": "string or null"
  },
  "customer": {
    "name": "string or null",
    "address": "string or null"
  },
  "lineItems": [
    {
      "description": "string (required)",
      "quantity": "number or null",
      "unitPrice": "number or null",
      "amount": "number (required)"
    }
  ],
  "totals": {
    "subtotal": "number or null",
    "tax": "number or null",
    "taxRate": "string (e.g., '8.25%') or null",
    "discount": "number or null",
    "shipping": "number or null",
    "total": "number (required)"
  },
  "paymentInfo": {
    "terms": "string (e.g., 'Net 30') or null",
    "method": "string or null",
    "bankDetails": "string or null"
  },
  "currency": "string (ISO 4217 code, e.g., 'USD')",
  "confidence": "number between 0 and 1 indicating extraction confidence"
}

Guidelines:
- All monetary values should be numbers without currency symbols
- Dates should be normalized to YYYY-MM-DD format
- If a field cannot be determined, use null
- Set confidence based on how clearly the data was present in the invoice
- Extract ALL line items found in the invoice
- Currency should be the 3-letter ISO code (USD, EUR, GBP, etc.)

Invoice text to extract:
`;

export async function processInvoiceJob(job: ToolJob): Promise<JobResult> {
	const input = job.input as unknown as InvoiceProcessorInput;

	if (!input.invoiceText || input.invoiceText.trim().length === 0) {
		return {
			success: false,
			error: "Invoice text is required",
		};
	}

	try {
		const result = await executePrompt(
			`${INVOICE_EXTRACTION_PROMPT}\n\n${input.invoiceText}`,
			{
				model: "claude-3-5-haiku-20241022",
				maxTokens: 4096,
				temperature: 0.1,
				system: "You are a precise invoice data extraction assistant. Output only valid JSON.",
			},
		);

		const extractedData = JSON.parse(
			result.content,
		) as InvoiceProcessorOutput;

		const output: InvoiceProcessorOutput = {
			vendor: {
				name: extractedData.vendor?.name ?? "Unknown Vendor",
				address: extractedData.vendor?.address ?? null,
				phone: extractedData.vendor?.phone ?? null,
				email: extractedData.vendor?.email ?? null,
				taxId: extractedData.vendor?.taxId ?? null,
			},
			invoice: {
				number: extractedData.invoice?.number ?? null,
				date: extractedData.invoice?.date ?? null,
				dueDate: extractedData.invoice?.dueDate ?? null,
				purchaseOrderNumber:
					extractedData.invoice?.purchaseOrderNumber ?? null,
			},
			customer: {
				name: extractedData.customer?.name ?? null,
				address: extractedData.customer?.address ?? null,
			},
			lineItems: extractedData.lineItems ?? [],
			totals: {
				subtotal: extractedData.totals?.subtotal ?? null,
				tax: extractedData.totals?.tax ?? null,
				taxRate: extractedData.totals?.taxRate ?? null,
				discount: extractedData.totals?.discount ?? null,
				shipping: extractedData.totals?.shipping ?? null,
				total: extractedData.totals?.total ?? 0,
			},
			paymentInfo: {
				terms: extractedData.paymentInfo?.terms ?? null,
				method: extractedData.paymentInfo?.method ?? null,
				bankDetails: extractedData.paymentInfo?.bankDetails ?? null,
			},
			currency: extractedData.currency ?? "USD",
			confidence: extractedData.confidence ?? 0.8,
		};

		return {
			success: true,
			output: output as unknown as Record<string, unknown>,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error
				? error.message
				: "Failed to process invoice";
		return {
			success: false,
			error: errorMessage,
		};
	}
}
