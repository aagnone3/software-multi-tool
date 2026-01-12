import { executePrompt } from "@repo/agent-sdk";
import type { Prisma, ToolJob } from "@repo/database/prisma/generated/client";
import type { JobResult } from "../../jobs/lib/processor-registry";
import type { ContractAnalyzerInput, ContractAnalyzerOutput } from "../types";
import { extractTextFromDocument } from "./document-extractor";

const CONTRACT_ANALYSIS_PROMPT = `You are an expert legal contract analyzer. Analyze the following contract text and extract structured information.

IMPORTANT: Return ONLY valid JSON with no additional text or explanation. The JSON must conform exactly to this schema:

{
  "summary": {
    "contractType": "string (e.g., 'Service Agreement', 'NDA', 'Employment Contract')",
    "parties": [{ "name": "string", "role": "string (e.g., 'Service Provider', 'Client')" }],
    "effectiveDate": "string (YYYY-MM-DD) or null",
    "expirationDate": "string (YYYY-MM-DD) or null",
    "governingLaw": "string (jurisdiction) or null",
    "overview": "string (2-3 sentence summary)"
  },
  "keyTerms": [
    { "term": "string", "definition": "string", "section": "string or null" }
  ],
  "financialTerms": {
    "totalValue": "number or null",
    "currency": "string (ISO code) or null",
    "paymentSchedule": "string or null",
    "penalties": ["array of penalty descriptions"]
  },
  "obligations": [
    {
      "party": "string",
      "description": "string",
      "deadline": "string or null",
      "isRecurring": "boolean",
      "frequency": "string or null"
    }
  ],
  "risks": [
    {
      "category": "string (e.g., 'Liability', 'Termination', 'IP')",
      "description": "string",
      "severity": "low | medium | high | critical",
      "clause": "string (relevant clause text) or null",
      "recommendation": "string"
    }
  ],
  "termination": {
    "noticePeriod": "string or null",
    "terminationClauses": ["array of termination conditions"],
    "autoRenewal": "boolean or null",
    "renewalTerms": "string or null"
  },
  "intellectualProperty": {
    "ownership": "string or null",
    "licenses": ["array of license grants"],
    "restrictions": ["array of IP restrictions"]
  },
  "confidentiality": {
    "hasNDA": "boolean",
    "duration": "string or null",
    "scope": "string or null"
  },
  "disputeResolution": {
    "method": "string (e.g., 'Arbitration', 'Litigation') or null",
    "venue": "string or null",
    "arbitrationRules": "string or null"
  },
  "overallRiskScore": "number 0-100 (0=low risk, 100=high risk)",
  "recommendations": ["array of recommendations for the reviewing party"]
}

Guidelines:
- Focus on identifying potential risks and red flags
- Note any unusual or one-sided clauses
- Identify missing standard protections
- Highlight ambiguous language that could cause disputes
- Consider both parties' perspectives for risks
- Rate severity based on potential business impact

Contract text to analyze:
`;

export async function processContractJob(job: ToolJob): Promise<JobResult> {
	const input = job.input as unknown as ContractAnalyzerInput;

	let contractText: string;

	// Handle file upload vs direct text input
	if (input.fileData) {
		// Extract text from uploaded file
		const buffer = Buffer.from(input.fileData.content, "base64");
		const extractionResult = await extractTextFromDocument(
			buffer,
			input.fileData.mimeType,
			input.fileData.filename,
		);

		if (!extractionResult.success) {
			return {
				success: false,
				error: extractionResult.error.message,
			};
		}

		contractText = extractionResult.text;
	} else if (input.contractText && input.contractText.trim().length > 0) {
		contractText = input.contractText;
	} else {
		return {
			success: false,
			error: "Either contract text or a file upload is required",
		};
	}

	try {
		const result = await executePrompt(
			`${CONTRACT_ANALYSIS_PROMPT}\n\n${contractText}`,
			{
				model: "claude-3-5-sonnet-20241022",
				maxTokens: 8192,
				temperature: 0.2,
				system: "You are an expert legal contract analyst. Output only valid JSON. Be thorough in identifying risks.",
			},
		);

		const analysisData = JSON.parse(
			result.content,
		) as ContractAnalyzerOutput;

		const output: ContractAnalyzerOutput = {
			summary: {
				contractType: analysisData.summary?.contractType ?? "Unknown",
				parties: analysisData.summary?.parties ?? [],
				effectiveDate: analysisData.summary?.effectiveDate ?? null,
				expirationDate: analysisData.summary?.expirationDate ?? null,
				governingLaw: analysisData.summary?.governingLaw ?? null,
				overview: analysisData.summary?.overview ?? "",
			},
			keyTerms: analysisData.keyTerms ?? [],
			financialTerms: {
				totalValue: analysisData.financialTerms?.totalValue ?? null,
				currency: analysisData.financialTerms?.currency ?? null,
				paymentSchedule:
					analysisData.financialTerms?.paymentSchedule ?? null,
				penalties: analysisData.financialTerms?.penalties ?? [],
			},
			obligations: analysisData.obligations ?? [],
			risks: analysisData.risks ?? [],
			termination: {
				noticePeriod: analysisData.termination?.noticePeriod ?? null,
				terminationClauses:
					analysisData.termination?.terminationClauses ?? [],
				autoRenewal: analysisData.termination?.autoRenewal ?? null,
				renewalTerms: analysisData.termination?.renewalTerms ?? null,
			},
			intellectualProperty: {
				ownership: analysisData.intellectualProperty?.ownership ?? null,
				licenses: analysisData.intellectualProperty?.licenses ?? [],
				restrictions:
					analysisData.intellectualProperty?.restrictions ?? [],
			},
			confidentiality: {
				hasNDA: analysisData.confidentiality?.hasNDA ?? false,
				duration: analysisData.confidentiality?.duration ?? null,
				scope: analysisData.confidentiality?.scope ?? null,
			},
			disputeResolution: {
				method: analysisData.disputeResolution?.method ?? null,
				venue: analysisData.disputeResolution?.venue ?? null,
				arbitrationRules:
					analysisData.disputeResolution?.arbitrationRules ?? null,
			},
			overallRiskScore: analysisData.overallRiskScore ?? 50,
			recommendations: analysisData.recommendations ?? [],
		};

		return {
			success: true,
			output: output as unknown as Prisma.InputJsonValue,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error
				? error.message
				: "Failed to analyze contract";
		return {
			success: false,
			error: errorMessage,
		};
	}
}
