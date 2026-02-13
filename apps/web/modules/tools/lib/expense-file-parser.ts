/**
 * Expense file parsing utilities for CSV and XLSX files.
 * Provides automatic delimiter detection for CSV files and column detection heuristics.
 */
import Papa from "papaparse";
import * as XLSX from "xlsx";

// ============================================================================
// Types
// ============================================================================

/**
 * Represents a raw row of data parsed from a file.
 */
export type RawRow = Record<string, string | number | null>;

/**
 * Result of parsing a file.
 */
export interface ParseResult {
	/**
	 * Whether parsing was successful.
	 */
	success: boolean;

	/**
	 * The parsed data rows.
	 */
	data: RawRow[];

	/**
	 * Column headers detected in the file.
	 */
	headers: string[];

	/**
	 * Error message if parsing failed.
	 */
	error?: string;

	/**
	 * The detected delimiter (for CSV files).
	 */
	detectedDelimiter?: string;
}

/**
 * Standard expense fields that can be mapped.
 */
export type ExpenseField =
	| "description"
	| "amount"
	| "date"
	| "vendor"
	| "category";

/**
 * Column mapping from source column to expense field.
 */
export interface ColumnMapping {
	/**
	 * The source column header from the file.
	 */
	sourceColumn: string;

	/**
	 * The target expense field.
	 */
	targetField: ExpenseField;
}

/**
 * Auto-detected column mappings with confidence scores.
 */
export interface DetectedMapping {
	/**
	 * The suggested mappings.
	 */
	mappings: ColumnMapping[];

	/**
	 * Confidence score for each mapping (0-1).
	 */
	confidence: Record<string, number>;

	/**
	 * Columns that could not be automatically mapped.
	 */
	unmappedColumns: string[];
}

/**
 * A parsed expense ready for categorization.
 */
export interface ParsedExpense {
	description: string;
	amount: number;
	date?: string;
	vendor?: string;
}

// ============================================================================
// CSV Parser
// ============================================================================

/**
 * Detect the delimiter used in a CSV string.
 * Tests common delimiters and returns the one that produces the most consistent column count.
 */
export function detectDelimiter(csvContent: string): string {
	const delimiters = [",", ";", "\t", "|"];
	const lines = csvContent.split("\n").slice(0, 10); // Check first 10 lines

	let bestDelimiter = ",";
	let bestConsistency = 0;

	for (const delimiter of delimiters) {
		const columnCounts = lines
			.filter((line) => line.trim().length > 0)
			.map((line) => line.split(delimiter).length);

		if (columnCounts.length === 0) {
			continue;
		}

		// Check consistency of column counts
		const firstCount = columnCounts[0];
		const consistentLines = columnCounts.filter(
			(count) => count === firstCount,
		).length;
		const consistency = consistentLines / columnCounts.length;

		// Prefer delimiter with more columns and higher consistency
		const score = consistency * firstCount;
		if (score > bestConsistency) {
			bestConsistency = score;
			bestDelimiter = delimiter;
		}
	}

	return bestDelimiter;
}

/**
 * Parse a CSV file content into structured data.
 * Automatically detects the delimiter if not provided.
 */
export function parseCSV(content: string, delimiter?: string): ParseResult {
	try {
		// Detect delimiter if not provided
		const detectedDelimiter = delimiter ?? detectDelimiter(content);

		const result = Papa.parse<RawRow>(content, {
			delimiter: detectedDelimiter,
			header: true,
			skipEmptyLines: true,
			dynamicTyping: true,
			transformHeader: (header) => header.trim(),
		});

		if (result.errors.length > 0 && result.data.length === 0) {
			return {
				success: false,
				data: [],
				headers: [],
				error: result.errors[0].message,
			};
		}

		const headers = result.meta.fields ?? [];

		return {
			success: true,
			data: result.data,
			headers,
			detectedDelimiter,
		};
	} catch (error) {
		return {
			success: false,
			data: [],
			headers: [],
			error:
				error instanceof Error
					? error.message
					: "Failed to parse CSV file",
		};
	}
}

// ============================================================================
// XLSX Parser
// ============================================================================

/**
 * Parse an XLSX file buffer into structured data.
 * Uses the first sheet by default.
 */
export function parseXLSX(buffer: ArrayBuffer, sheetIndex = 0): ParseResult {
	try {
		const workbook = XLSX.read(buffer, { type: "array" });

		const sheetNames = workbook.SheetNames;
		if (sheetNames.length === 0) {
			return {
				success: false,
				data: [],
				headers: [],
				error: "No sheets found in workbook",
			};
		}

		const sheetName = sheetNames[sheetIndex] ?? sheetNames[0];
		const sheet = workbook.Sheets[sheetName];

		if (!sheet) {
			return {
				success: false,
				data: [],
				headers: [],
				error: `Sheet "${sheetName}" not found`,
			};
		}

		// Convert sheet to JSON with headers
		const data = XLSX.utils.sheet_to_json<RawRow>(sheet, {
			raw: false,
			defval: null,
		});

		// Extract headers from the first row keys
		const headers = data.length > 0 ? Object.keys(data[0]) : [];

		return {
			success: true,
			data,
			headers,
		};
	} catch (error) {
		return {
			success: false,
			data: [],
			headers: [],
			error:
				error instanceof Error
					? error.message
					: "Failed to parse XLSX file",
		};
	}
}

// ============================================================================
// Column Detection
// ============================================================================

/**
 * Keywords and patterns for detecting expense columns.
 */
const COLUMN_PATTERNS: Record<ExpenseField, RegExp[]> = {
	description: [
		/^desc(ription)?$/i,
		/^memo$/i,
		/^note(s)?$/i,
		/^detail(s)?$/i,
		/^transaction$/i,
		/^item$/i,
		/^particulars$/i,
		/^narration$/i,
	],
	amount: [
		/^amount$/i,
		/^total$/i,
		/^sum$/i,
		/^debit$/i,
		/^credit$/i,
		/^value$/i,
		/^charge$/i,
		/^cost$/i,
		/^price$/i,
		/^payment$/i,
		/^withdrawal$/i,
		/^spend$/i,
	],
	date: [
		/^date$/i,
		/^trans(action)?[_\s-]?date$/i,
		/^posted[_\s-]?date$/i,
		/^value[_\s-]?date$/i,
		/^when$/i,
		/^timestamp$/i,
	],
	vendor: [
		/^vendor$/i,
		/^merchant$/i,
		/^payee$/i,
		/^supplier$/i,
		/^name$/i,
		/^company$/i,
		/^store$/i,
		/^seller$/i,
		/^recipient$/i,
	],
	category: [
		/^category$/i,
		/^type$/i,
		/^class$/i,
		/^classification$/i,
		/^group$/i,
		/^expense[_\s-]?type$/i,
	],
};

/**
 * Detect if a value looks like a monetary amount.
 */
function isMoneyValue(value: string | number | null): boolean {
	if (value === null) {
		return false;
	}
	const strValue = String(value);
	// Matches: $123.45, 123.45, -$123.45, (123.45), 1,234.56, etc.
	return /^[$£€]?[\s]*[-(]?[\d,]+\.?\d*[)]?$/.test(strValue.trim());
}

/**
 * Detect if a value looks like a date.
 */
function isDateValue(value: string | number | null): boolean {
	if (value === null) {
		return false;
	}
	const strValue = String(value);
	// Common date patterns
	const datePatterns = [
		/^\d{4}[-/]\d{2}[-/]\d{2}$/, // YYYY-MM-DD
		/^\d{2}[-/]\d{2}[-/]\d{4}$/, // MM-DD-YYYY or DD-MM-YYYY
		/^\d{2}[-/]\d{2}[-/]\d{2}$/, // MM-DD-YY or DD-MM-YY
		/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/, // M/D/YYYY variations
		/^[A-Za-z]{3}\s+\d{1,2},?\s+\d{4}$/, // Jan 15, 2024
	];
	return datePatterns.some((pattern) => pattern.test(strValue.trim()));
}

/**
 * Calculate confidence score for a column-to-field mapping.
 */
function calculateConfidence(
	header: string,
	field: ExpenseField,
	sampleValues: (string | number | null)[],
): number {
	let score = 0;

	// Check header name patterns (40% weight)
	const patterns = COLUMN_PATTERNS[field];
	const headerMatches = patterns.some((pattern) => pattern.test(header));
	if (headerMatches) {
		score += 0.4;
	}

	// Check partial header matches (20% weight)
	const fieldLower = field.toLowerCase();
	const headerLower = header.toLowerCase();
	if (headerLower.includes(fieldLower) || fieldLower.includes(headerLower)) {
		score += 0.2;
	}

	// Check value patterns (40% weight)
	const nonEmptyValues = sampleValues.filter((v) => v !== null && v !== "");
	if (nonEmptyValues.length > 0) {
		let valueMatches = 0;

		for (const value of nonEmptyValues) {
			if (field === "amount" && isMoneyValue(value)) {
				valueMatches++;
			} else if (field === "date" && isDateValue(value)) {
				valueMatches++;
			} else if (
				(field === "description" || field === "vendor") &&
				typeof value === "string" &&
				value.length > 3
			) {
				// Text fields should have reasonable length
				valueMatches++;
			}
		}

		const valueScore = valueMatches / nonEmptyValues.length;
		score += valueScore * 0.4;
	}

	return Math.min(score, 1);
}

/**
 * Automatically detect column mappings from parsed data.
 */
export function detectColumnMappings(
	headers: string[],
	data: RawRow[],
): DetectedMapping {
	const mappings: ColumnMapping[] = [];
	const confidence: Record<string, number> = {};
	const mappedFields = new Set<ExpenseField>();
	const mappedColumns = new Set<string>();

	// Get sample values for each column (first 10 rows)
	const sampleData = data.slice(0, 10);

	// Score each header against each field
	const scores: Array<{
		header: string;
		field: ExpenseField;
		score: number;
	}> = [];

	const fields: ExpenseField[] = [
		"description",
		"amount",
		"date",
		"vendor",
		"category",
	];

	for (const header of headers) {
		const sampleValues = sampleData.map((row) => row[header] ?? null);

		for (const field of fields) {
			const score = calculateConfidence(header, field, sampleValues);
			if (score > 0.1) {
				scores.push({ header, field, score });
			}
		}
	}

	// Sort by score descending and assign best matches
	scores.sort((a, b) => b.score - a.score);

	for (const { header, field, score } of scores) {
		// Skip if field or column already mapped
		if (mappedFields.has(field) || mappedColumns.has(header)) {
			continue;
		}

		// Only map if confidence is reasonable
		if (score >= 0.2) {
			mappings.push({
				sourceColumn: header,
				targetField: field,
			});
			confidence[header] = score;
			mappedFields.add(field);
			mappedColumns.add(header);
		}
	}

	// Find unmapped columns
	const unmappedColumns = headers.filter((h) => !mappedColumns.has(h));

	return {
		mappings,
		confidence,
		unmappedColumns,
	};
}

// ============================================================================
// Data Transformation
// ============================================================================

/**
 * Parse a monetary value string to a number.
 */
export function parseAmount(value: string | number | null): number | null {
	if (value === null) {
		return null;
	}

	const strValue = String(value);

	// Remove currency symbols and commas
	let cleaned = strValue.replace(/[$£€]/g, "").replace(/,/g, "").trim();

	// Handle parentheses for negative values: (123.45) -> -123.45
	if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
		cleaned = `-${cleaned.slice(1, -1)}`;
	}

	const parsed = Number.parseFloat(cleaned);
	return Number.isNaN(parsed) ? null : Math.abs(parsed);
}

/**
 * Normalize a date string to YYYY-MM-DD format.
 */
export function normalizeDate(value: string | number | null): string | null {
	if (value === null) {
		return null;
	}

	const strValue = String(value).trim();

	// Try parsing with built-in Date
	const date = new Date(strValue);
	if (!Number.isNaN(date.getTime())) {
		return date.toISOString().split("T")[0];
	}

	// Try common formats manually
	// MM/DD/YYYY or DD/MM/YYYY
	const slashMatch = strValue.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
	if (slashMatch) {
		let [, part1, part2, year] = slashMatch;
		if (year.length === 2) {
			year = (Number.parseInt(year, 10) > 50 ? "19" : "20") + year;
		}
		// Assume MM/DD/YYYY for US format
		const month = part1.padStart(2, "0");
		const day = part2.padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	return null;
}

/**
 * Transform raw data rows to parsed expenses using column mappings.
 */
export function transformToExpenses(
	data: RawRow[],
	mappings: ColumnMapping[],
): ParsedExpense[] {
	const fieldToColumn = new Map<ExpenseField, string>();
	for (const mapping of mappings) {
		fieldToColumn.set(mapping.targetField, mapping.sourceColumn);
	}

	const expenses: ParsedExpense[] = [];

	for (const row of data) {
		const descriptionCol = fieldToColumn.get("description");
		const amountCol = fieldToColumn.get("amount");
		const dateCol = fieldToColumn.get("date");
		const vendorCol = fieldToColumn.get("vendor");

		// Description and amount are required
		if (!descriptionCol || !amountCol) {
			continue;
		}

		const description = row[descriptionCol];
		const rawAmount = row[amountCol];

		if (!description || rawAmount === null || rawAmount === "") {
			continue;
		}

		const amount = parseAmount(rawAmount);
		if (amount === null || amount <= 0) {
			continue;
		}

		const expense: ParsedExpense = {
			description: String(description).trim(),
			amount,
		};

		// Add optional fields
		if (dateCol && row[dateCol]) {
			const normalizedDate = normalizeDate(row[dateCol]);
			if (normalizedDate) {
				expense.date = normalizedDate;
			}
		}

		if (vendorCol && row[vendorCol]) {
			expense.vendor = String(row[vendorCol]).trim();
		}

		expenses.push(expense);
	}

	return expenses;
}

// ============================================================================
// CSV Export
// ============================================================================

/**
 * Export categorized expenses to CSV format.
 */
export function exportToCSV(
	expenses: Array<{
		originalDescription: string;
		amount: number;
		date?: string | null;
		vendor?: string | null;
		category: string;
		subcategory?: string | null;
		taxInfo?: {
			irsCategory?: string;
			scheduleLocation?: string;
			isDeductible?: boolean;
			deductionPercentage?: number;
		};
		confidence?: number;
	}>,
): string {
	const headers = [
		"Description",
		"Amount",
		"Date",
		"Vendor",
		"Category",
		"Subcategory",
		"IRS Category",
		"Schedule Location",
		"Deductible",
		"Deduction %",
		"Confidence",
	];

	const rows = expenses.map((expense) => [
		expense.originalDescription,
		expense.amount.toFixed(2),
		expense.date ?? "",
		expense.vendor ?? "",
		expense.category,
		expense.subcategory ?? "",
		expense.taxInfo?.irsCategory ?? "",
		expense.taxInfo?.scheduleLocation ?? "",
		expense.taxInfo?.isDeductible ? "Yes" : "No",
		expense.taxInfo?.deductionPercentage?.toString() ?? "",
		expense.confidence ? `${(expense.confidence * 100).toFixed(0)}%` : "",
	]);

	return Papa.unparse({
		fields: headers,
		data: rows,
	});
}

// ============================================================================
// File Validation
// ============================================================================

/**
 * Validate file for upload.
 * @param file - The file to validate
 * @param maxSizeBytes - Maximum file size in bytes (default 5MB)
 */
export function validateExpenseFile(
	file: File,
	maxSizeBytes = 5 * 1024 * 1024,
): { valid: boolean; error?: string } {
	// Check file size
	if (file.size > maxSizeBytes) {
		const maxSizeMB = maxSizeBytes / (1024 * 1024);
		return {
			valid: false,
			error: `File size exceeds ${maxSizeMB}MB limit`,
		};
	}

	// Check file type
	const allowedTypes = [
		"text/csv",
		"application/vnd.ms-excel",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	];
	const allowedExtensions = [".csv", ".xlsx", ".xls"];

	const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

	if (!allowedExtensions.includes(extension)) {
		return {
			valid: false,
			error: "Only CSV and Excel files are supported",
		};
	}

	// MIME type check (optional, some systems don't set it correctly)
	if (file.type && !allowedTypes.includes(file.type) && file.type !== "") {
		// Allow empty type as some browsers don't set it for CSV
		if (!extension.includes("csv") && !extension.includes("xls")) {
			return {
				valid: false,
				error: "Invalid file type. Only CSV and Excel files are supported",
			};
		}
	}

	return { valid: true };
}

/**
 * Parse a file (CSV or XLSX) based on its extension.
 */
export async function parseExpenseFile(file: File): Promise<ParseResult> {
	const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

	if (extension === ".csv") {
		const content = await file.text();
		return parseCSV(content);
	}

	if (extension === ".xlsx" || extension === ".xls") {
		const buffer = await file.arrayBuffer();
		return parseXLSX(buffer);
	}

	return {
		success: false,
		data: [],
		headers: [],
		error: "Unsupported file format",
	};
}
