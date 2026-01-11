import { executePrompt } from "@repo/agent-sdk";
import type { ToolJob } from "@repo/database/prisma/generated/client";
import type { JobResult } from "../../jobs/lib/processor-registry";
import type {
	ExpenseCategorizerInput,
	ExpenseCategorizerOutput,
	ExpenseItem,
} from "../types";

const EXPENSE_CATEGORIZATION_PROMPT = `You are an expert accountant specializing in business expense categorization for tax purposes. Categorize the following expenses according to IRS guidelines.

IMPORTANT: Return ONLY valid JSON with no additional text or explanation. The JSON must conform exactly to this schema:

{
  "categorizedExpenses": [
    {
      "originalDescription": "string",
      "amount": "number",
      "date": "string (YYYY-MM-DD) or null",
      "vendor": "string or null",
      "category": "advertising | car_vehicle | commissions_fees | contract_labor | depreciation | employee_benefits | insurance | interest_mortgage | interest_other | legal_professional | office_expense | pension_profit_sharing | rent_lease_equipment | rent_lease_property | repairs_maintenance | supplies | taxes_licenses | travel | meals_entertainment | utilities | wages | other | personal",
      "subcategory": "string (more specific category) or null",
      "taxInfo": {
        "irsCategory": "string (official IRS category name)",
        "scheduleLocation": "string (e.g., 'Schedule C, Line 8')",
        "isDeductible": "boolean",
        "deductionPercentage": "number 0-100",
        "notes": "string or null"
      },
      "confidence": "number 0-1",
      "flags": ["array of any concerns or notes"],
      "suggestedNotes": "string or null (documentation suggestion)"
    }
  ],
  "summary": {
    "totalAmount": "number",
    "totalDeductible": "number",
    "totalNonDeductible": "number",
    "categoryBreakdown": [
      {
        "category": "string",
        "amount": "number",
        "count": "number",
        "deductibleAmount": "number"
      }
    ]
  },
  "taxInsights": {
    "estimatedDeductions": "number",
    "potentialRedFlags": [
      {
        "expense": "string",
        "reason": "string",
        "recommendation": "string"
      }
    ],
    "missingDocumentation": ["array of documentation that may be needed"],
    "optimizationSuggestions": ["array of tax optimization tips"]
  },
  "exportFormats": {
    "quickbooksReady": true,
    "xeroReady": true,
    "csvAvailable": true
  }
}

Category Guidelines:
- advertising: Marketing, ads, promotional materials
- car_vehicle: Business vehicle expenses (often 50-100% deductible based on business use)
- commissions_fees: Payments to contractors for sales/services
- contract_labor: Payments to non-employees for services
- depreciation: Equipment depreciation (handled separately)
- employee_benefits: Health insurance, retirement contributions for employees
- insurance: Business insurance (not health)
- interest_mortgage: Mortgage interest on business property
- interest_other: Business loan interest
- legal_professional: Attorney, accountant, consultant fees
- office_expense: Office supplies, software subscriptions, small equipment
- pension_profit_sharing: Retirement plan contributions
- rent_lease_equipment: Equipment leases
- rent_lease_property: Office/warehouse rent
- repairs_maintenance: Building/equipment repairs
- supplies: Materials used in business
- taxes_licenses: Business taxes, licenses, permits
- travel: Business travel (flights, hotels, transportation)
- meals_entertainment: Business meals (usually 50% deductible)
- utilities: Business utilities
- wages: Employee salaries
- other: Legitimate business expenses not fitting other categories
- personal: Non-deductible personal expenses

Expenses to categorize:
`;

export async function processExpenseJob(job: ToolJob): Promise<JobResult> {
	const input = job.input as unknown as ExpenseCategorizerInput;

	const expenses: ExpenseItem[] = Array.isArray(input.expenses)
		? input.expenses
		: [input.expenses];

	if (expenses.length === 0) {
		return {
			success: false,
			error: "At least one expense is required",
		};
	}

	const expenseText = expenses
		.map(
			(e, i) =>
				`${i + 1}. ${e.description} - $${e.amount}${e.date ? ` (${e.date})` : ""}${e.vendor ? ` from ${e.vendor}` : ""}`,
		)
		.join("\n");

	const contextInfo = [
		input.businessType && `Business Type: ${input.businessType}`,
		input.taxYear && `Tax Year: ${input.taxYear}`,
		input.country && `Country: ${input.country}`,
	]
		.filter(Boolean)
		.join("\n");

	try {
		const result = await executePrompt(
			`${EXPENSE_CATEGORIZATION_PROMPT}\n\n${contextInfo ? `Context:\n${contextInfo}\n\n` : ""}${expenseText}`,
			{
				model: "claude-3-5-haiku-20241022",
				maxTokens: 8192,
				temperature: 0.1,
				system: "You are an expert tax accountant. Output only valid JSON. Be conservative with deduction claims.",
			},
		);

		const analysisData = JSON.parse(
			result.content,
		) as ExpenseCategorizerOutput;

		const output: ExpenseCategorizerOutput = {
			categorizedExpenses: analysisData.categorizedExpenses ?? [],
			summary: {
				totalAmount: analysisData.summary?.totalAmount ?? 0,
				totalDeductible: analysisData.summary?.totalDeductible ?? 0,
				totalNonDeductible:
					analysisData.summary?.totalNonDeductible ?? 0,
				categoryBreakdown:
					analysisData.summary?.categoryBreakdown ?? [],
			},
			taxInsights: {
				estimatedDeductions:
					analysisData.taxInsights?.estimatedDeductions ?? 0,
				potentialRedFlags:
					analysisData.taxInsights?.potentialRedFlags ?? [],
				missingDocumentation:
					analysisData.taxInsights?.missingDocumentation ?? [],
				optimizationSuggestions:
					analysisData.taxInsights?.optimizationSuggestions ?? [],
			},
			exportFormats: {
				quickbooksReady: true,
				xeroReady: true,
				csvAvailable: true,
			},
		};

		return {
			success: true,
			output: output as unknown as Record<string, unknown>,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error
				? error.message
				: "Failed to categorize expenses";
		return {
			success: false,
			error: errorMessage,
		};
	}
}
