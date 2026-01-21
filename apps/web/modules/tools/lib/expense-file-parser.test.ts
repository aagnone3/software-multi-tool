/**
 * Unit tests for expense file parsing utilities.
 */
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
	type ColumnMapping,
	detectColumnMappings,
	detectDelimiter,
	exportToCSV,
	normalizeDate,
	parseAmount,
	parseCSV,
	parseXLSX,
	type RawRow,
	transformToExpenses,
	validateExpenseFile,
} from "./expense-file-parser";

// ============================================================================
// CSV Parser Tests
// ============================================================================

describe("detectDelimiter", () => {
	it("detects comma delimiter", () => {
		const csv = `name,amount,date
Item 1,100.00,2024-01-15
Item 2,200.00,2024-01-16`;
		expect(detectDelimiter(csv)).toBe(",");
	});

	it("detects semicolon delimiter", () => {
		const csv = `name;amount;date
Item 1;100.00;2024-01-15
Item 2;200.00;2024-01-16`;
		expect(detectDelimiter(csv)).toBe(";");
	});

	it("detects tab delimiter", () => {
		const csv = `name\tamount\tdate
Item 1\t100.00\t2024-01-15
Item 2\t200.00\t2024-01-16`;
		expect(detectDelimiter(csv)).toBe("\t");
	});

	it("detects pipe delimiter", () => {
		const csv = `name|amount|date
Item 1|100.00|2024-01-15
Item 2|200.00|2024-01-16`;
		expect(detectDelimiter(csv)).toBe("|");
	});

	it("defaults to comma for ambiguous content", () => {
		const csv = "single line content";
		expect(detectDelimiter(csv)).toBe(",");
	});

	it("handles empty content", () => {
		expect(detectDelimiter("")).toBe(",");
	});

	it("prefers delimiter with more columns and consistency", () => {
		// This CSV has commas in the data but semicolons as delimiters
		const csv = `name;amount;description
Item 1;100.00;Contains, a comma
Item 2;200.00;Another, comma here`;
		expect(detectDelimiter(csv)).toBe(";");
	});
});

describe("parseCSV", () => {
	it("parses simple CSV content", () => {
		const csv = `description,amount,date
Coffee,5.50,2024-01-15
Lunch,15.00,2024-01-15`;

		const result = parseCSV(csv);

		expect(result.success).toBe(true);
		expect(result.headers).toEqual(["description", "amount", "date"]);
		expect(result.data).toHaveLength(2);
		expect(result.data[0]).toEqual({
			description: "Coffee",
			amount: 5.5,
			date: "2024-01-15",
		});
	});

	it("handles CSV with custom delimiter", () => {
		const csv = `description;amount;date
Coffee;5.50;2024-01-15`;

		const result = parseCSV(csv, ";");

		expect(result.success).toBe(true);
		expect(result.data[0]).toEqual({
			description: "Coffee",
			amount: 5.5,
			date: "2024-01-15",
		});
	});

	it("auto-detects delimiter when not provided", () => {
		const csv = `description|amount|date
Coffee|5.50|2024-01-15`;

		const result = parseCSV(csv);

		expect(result.success).toBe(true);
		expect(result.detectedDelimiter).toBe("|");
		expect(result.data[0].description).toBe("Coffee");
	});

	it("skips empty lines", () => {
		const csv = `description,amount

Coffee,5.50

Lunch,15.00
`;

		const result = parseCSV(csv);

		expect(result.success).toBe(true);
		expect(result.data).toHaveLength(2);
	});

	it("trims header whitespace", () => {
		const csv = `  description  , amount ,  date
Coffee,5.50,2024-01-15`;

		const result = parseCSV(csv);

		expect(result.headers).toEqual(["description", "amount", "date"]);
	});

	it("handles empty CSV", () => {
		const result = parseCSV("");

		expect(result.success).toBe(true);
		expect(result.data).toHaveLength(0);
		expect(result.headers).toHaveLength(0);
	});

	it("handles CSV with only headers", () => {
		const csv = "description,amount,date";

		const result = parseCSV(csv);

		expect(result.success).toBe(true);
		expect(result.headers).toEqual(["description", "amount", "date"]);
		expect(result.data).toHaveLength(0);
	});

	it("handles quoted values with commas", () => {
		// Use explicit delimiter to ensure comma parsing
		const csv = `description,amount
"Coffee, large size",5.50
"Lunch, with coworkers",15.00`;

		// Pass explicit comma delimiter
		const result = parseCSV(csv, ",");

		expect(result.success).toBe(true);
		expect(result.headers).toEqual(["description", "amount"]);
		expect(result.data[0].description).toBe("Coffee, large size");
		expect(result.data[1].description).toBe("Lunch, with coworkers");
	});

	it("handles numeric values with dynamic typing", () => {
		const csv = `item,quantity,price
Widgets,10,25.99
Gadgets,5,49.50`;

		const result = parseCSV(csv);

		expect(result.success).toBe(true);
		expect(result.data[0].quantity).toBe(10);
		expect(result.data[0].price).toBe(25.99);
	});
});

// ============================================================================
// XLSX Parser Tests
// ============================================================================

describe("parseXLSX", () => {
	function createXLSXBuffer(
		data: Record<string, unknown>[],
		sheetName = "Sheet1",
	): ArrayBuffer {
		const workbook = XLSX.utils.book_new();
		const worksheet = XLSX.utils.json_to_sheet(data);
		XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
		const buffer = XLSX.write(workbook, {
			type: "array",
			bookType: "xlsx",
		});
		return buffer;
	}

	it("parses XLSX with data", () => {
		const data = [
			{ description: "Coffee", amount: 5.5, date: "2024-01-15" },
			{ description: "Lunch", amount: 15.0, date: "2024-01-16" },
		];
		const buffer = createXLSXBuffer(data);

		const result = parseXLSX(buffer);

		expect(result.success).toBe(true);
		expect(result.headers).toEqual(["description", "amount", "date"]);
		expect(result.data).toHaveLength(2);
		expect(result.data[0].description).toBe("Coffee");
	});

	it("handles empty workbook", () => {
		// XLSX library throws when writing an empty workbook
		// So we test that parseXLSX handles the sheet not found scenario
		const workbook = XLSX.utils.book_new();
		const emptySheet = XLSX.utils.aoa_to_sheet([["header"]]);
		XLSX.utils.book_append_sheet(workbook, emptySheet, "Sheet1");
		const buffer = XLSX.write(workbook, {
			type: "array",
			bookType: "xlsx",
		});

		// Request a non-existent sheet index
		const result = parseXLSX(buffer, 99);

		// Falls back to first sheet when index out of bounds
		expect(result.success).toBe(true);
	});

	it("handles empty sheet", () => {
		const workbook = XLSX.utils.book_new();
		const worksheet = XLSX.utils.aoa_to_sheet([]);
		XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
		const buffer = XLSX.write(workbook, {
			type: "array",
			bookType: "xlsx",
		});

		const result = parseXLSX(buffer);

		expect(result.success).toBe(true);
		expect(result.data).toHaveLength(0);
		expect(result.headers).toHaveLength(0);
	});

	it("uses first sheet by default", () => {
		const workbook = XLSX.utils.book_new();
		const sheet1 = XLSX.utils.json_to_sheet([{ col: "value1" }]);
		const sheet2 = XLSX.utils.json_to_sheet([{ col: "value2" }]);
		XLSX.utils.book_append_sheet(workbook, sheet1, "First");
		XLSX.utils.book_append_sheet(workbook, sheet2, "Second");
		const buffer = XLSX.write(workbook, {
			type: "array",
			bookType: "xlsx",
		});

		const result = parseXLSX(buffer, 0);

		expect(result.success).toBe(true);
		expect(result.data[0].col).toBe("value1");
	});

	it("can select specific sheet by index", () => {
		const workbook = XLSX.utils.book_new();
		const sheet1 = XLSX.utils.json_to_sheet([{ col: "value1" }]);
		const sheet2 = XLSX.utils.json_to_sheet([{ col: "value2" }]);
		XLSX.utils.book_append_sheet(workbook, sheet1, "First");
		XLSX.utils.book_append_sheet(workbook, sheet2, "Second");
		const buffer = XLSX.write(workbook, {
			type: "array",
			bookType: "xlsx",
		});

		const result = parseXLSX(buffer, 1);

		expect(result.success).toBe(true);
		expect(result.data[0].col).toBe("value2");
	});

	it("handles truly invalid buffer", () => {
		// XLSX library is quite permissive with buffers
		// We need a buffer that will actually fail parsing
		const invalidBuffer = new Uint8Array([0x00, 0x01, 0x02, 0x03]).buffer;

		const result = parseXLSX(invalidBuffer);

		// XLSX library may parse some invalid buffers without error
		// but will return no sheets or empty data
		if (!result.success) {
			expect(result.error).toBeDefined();
		} else {
			// If it succeeds, it should return empty data
			expect(result.data.length).toBe(0);
		}
	});
});

// ============================================================================
// Column Detection Tests
// ============================================================================

describe("detectColumnMappings", () => {
	it("detects description column", () => {
		const headers = ["Description", "Price", "When"];
		const data: RawRow[] = [
			{
				Description: "Coffee at Starbucks",
				Price: 5.5,
				When: "2024-01-15",
			},
		];

		const result = detectColumnMappings(headers, data);

		const descMapping = result.mappings.find(
			(m) => m.targetField === "description",
		);
		expect(descMapping?.sourceColumn).toBe("Description");
	});

	it("detects amount column with various names", () => {
		const testCases = [
			{ header: "Amount", expected: true },
			{ header: "Total", expected: true },
			{ header: "Debit", expected: true },
			{ header: "Cost", expected: true },
			{ header: "Price", expected: true },
		];

		for (const { header, expected } of testCases) {
			const headers = ["Item", header];
			const data: RawRow[] = [{ Item: "Test", [header]: 100.5 }];

			const result = detectColumnMappings(headers, data);

			const amountMapping = result.mappings.find(
				(m) => m.targetField === "amount",
			);
			expect(
				amountMapping !== undefined,
				`Expected ${header} to ${expected ? "be" : "not be"} detected as amount`,
			).toBe(expected);
		}
	});

	it("detects date column", () => {
		const headers = ["Memo", "Value", "Transaction Date"];
		const data: RawRow[] = [
			{ Memo: "Test", Value: 50, "Transaction Date": "2024-01-15" },
		];

		const result = detectColumnMappings(headers, data);

		const dateMapping = result.mappings.find(
			(m) => m.targetField === "date",
		);
		expect(dateMapping?.sourceColumn).toBe("Transaction Date");
	});

	it("detects vendor column", () => {
		const headers = ["Merchant", "Amount", "Date"];
		const data: RawRow[] = [
			{ Merchant: "Starbucks", Amount: 5.5, Date: "2024-01-15" },
		];

		const result = detectColumnMappings(headers, data);

		const vendorMapping = result.mappings.find(
			(m) => m.targetField === "vendor",
		);
		expect(vendorMapping?.sourceColumn).toBe("Merchant");
	});

	it("detects category column", () => {
		const headers = ["Description", "Category", "Amount"];
		const data: RawRow[] = [
			{ Description: "Coffee", Category: "Food & Dining", Amount: 5.5 },
		];

		const result = detectColumnMappings(headers, data);

		const categoryMapping = result.mappings.find(
			(m) => m.targetField === "category",
		);
		expect(categoryMapping?.sourceColumn).toBe("Category");
	});

	it("uses value patterns to improve detection", () => {
		// Column named "val" but contains money values
		const headers = ["item", "val", "when"];
		const data: RawRow[] = [
			{ item: "Coffee", val: "$5.50", when: "01/15/2024" },
			{ item: "Lunch", val: "$15.00", when: "01/16/2024" },
		];

		const result = detectColumnMappings(headers, data);

		const amountMapping = result.mappings.find(
			(m) => m.targetField === "amount",
		);
		expect(amountMapping?.sourceColumn).toBe("val");
	});

	it("provides confidence scores", () => {
		const headers = ["Description", "Amount", "Date"];
		const data: RawRow[] = [
			{ Description: "Coffee", Amount: 5.5, Date: "2024-01-15" },
		];

		const result = detectColumnMappings(headers, data);

		// Exact header matches should have high confidence
		expect(result.confidence.Description).toBeGreaterThan(0.3);
		expect(result.confidence.Amount).toBeGreaterThan(0.3);
		expect(result.confidence.Date).toBeGreaterThan(0.3);
	});

	it("reports unmapped columns", () => {
		const headers = ["Description", "Amount", "RandomColumn", "Notes"];
		const data: RawRow[] = [
			{
				Description: "Coffee",
				Amount: 5.5,
				RandomColumn: "xyz",
				Notes: "test",
			},
		];

		const result = detectColumnMappings(headers, data);

		expect(result.unmappedColumns).toContain("RandomColumn");
	});

	it("maps each field only once", () => {
		const headers = ["Amount", "Total", "Cost"];
		const data: RawRow[] = [{ Amount: 10, Total: 10, Cost: 10 }];

		const result = detectColumnMappings(headers, data);

		const amountMappings = result.mappings.filter(
			(m) => m.targetField === "amount",
		);
		expect(amountMappings).toHaveLength(1);
	});

	it("maps each column only once", () => {
		const headers = ["Description"];
		const data: RawRow[] = [{ Description: "Test item" }];

		const result = detectColumnMappings(headers, data);

		const mappedCount = result.mappings.filter(
			(m) => m.sourceColumn === "Description",
		).length;
		expect(mappedCount).toBeLessThanOrEqual(1);
	});
});

// ============================================================================
// Amount Parsing Tests
// ============================================================================

describe("parseAmount", () => {
	it("parses plain numbers", () => {
		expect(parseAmount(100)).toBe(100);
		expect(parseAmount(100.5)).toBe(100.5);
		expect(parseAmount("100")).toBe(100);
		expect(parseAmount("100.50")).toBe(100.5);
	});

	it("handles currency symbols", () => {
		expect(parseAmount("$100.00")).toBe(100);
		expect(parseAmount("£50.00")).toBe(50);
		expect(parseAmount("€75.50")).toBe(75.5);
	});

	it("handles commas in thousands", () => {
		expect(parseAmount("1,000")).toBe(1000);
		expect(parseAmount("1,234.56")).toBe(1234.56);
		expect(parseAmount("$1,234,567.89")).toBe(1234567.89);
	});

	it("handles parentheses for negative values", () => {
		expect(parseAmount("(100.00)")).toBe(100);
		expect(parseAmount("$(500.00)")).toBe(500);
	});

	it("handles negative numbers", () => {
		expect(parseAmount("-100")).toBe(100);
		expect(parseAmount("-$50.00")).toBe(50);
	});

	it("handles whitespace", () => {
		expect(parseAmount("  100.00  ")).toBe(100);
		expect(parseAmount("$ 50.00")).toBe(50);
	});

	it("returns null for invalid values", () => {
		expect(parseAmount(null)).toBeNull();
		expect(parseAmount("abc")).toBeNull();
		expect(parseAmount("")).toBeNull();
	});
});

// ============================================================================
// Date Normalization Tests
// ============================================================================

describe("normalizeDate", () => {
	it("normalizes ISO format dates", () => {
		expect(normalizeDate("2024-01-15")).toBe("2024-01-15");
	});

	it("normalizes MM/DD/YYYY format", () => {
		expect(normalizeDate("01/15/2024")).toBe("2024-01-15");
		expect(normalizeDate("1/5/2024")).toBe("2024-01-05");
	});

	it("normalizes MM-DD-YYYY format", () => {
		expect(normalizeDate("01-15-2024")).toBe("2024-01-15");
	});

	it("normalizes two-digit years", () => {
		expect(normalizeDate("01/15/24")).toBe("2024-01-15");
		expect(normalizeDate("01/15/99")).toBe("1999-01-15");
	});

	it("normalizes text dates", () => {
		const result = normalizeDate("Jan 15, 2024");
		// The exact format depends on Date parsing, but should be valid
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it("returns null for invalid dates", () => {
		expect(normalizeDate(null)).toBeNull();
		expect(normalizeDate("not a date")).toBeNull();
		expect(normalizeDate("")).toBeNull();
	});
});

// ============================================================================
// Data Transformation Tests
// ============================================================================

describe("transformToExpenses", () => {
	const mappings: ColumnMapping[] = [
		{ sourceColumn: "desc", targetField: "description" },
		{ sourceColumn: "amt", targetField: "amount" },
		{ sourceColumn: "dt", targetField: "date" },
		{ sourceColumn: "vendor_name", targetField: "vendor" },
	];

	it("transforms rows to expenses", () => {
		const data: RawRow[] = [
			{
				desc: "Coffee at Starbucks",
				amt: "$5.50",
				dt: "01/15/2024",
				vendor_name: "Starbucks",
			},
		];

		const expenses = transformToExpenses(data, mappings);

		expect(expenses).toHaveLength(1);
		expect(expenses[0]).toEqual({
			description: "Coffee at Starbucks",
			amount: 5.5,
			date: "2024-01-15",
			vendor: "Starbucks",
		});
	});

	it("skips rows without required fields", () => {
		const data: RawRow[] = [
			{ desc: null, amt: 5.5, dt: "2024-01-15", vendor_name: "Test" },
			{
				desc: "Coffee",
				amt: null,
				dt: "2024-01-15",
				vendor_name: "Test",
			},
			{ desc: "Coffee", amt: 5.5, dt: "2024-01-15", vendor_name: "Test" },
		];

		const expenses = transformToExpenses(data, mappings);

		expect(expenses).toHaveLength(1);
	});

	it("skips rows with zero amounts but converts negative to positive", () => {
		// parseAmount uses Math.abs, so negative values become positive
		const data: RawRow[] = [
			{ desc: "Test1", amt: 0, dt: "2024-01-15", vendor_name: "Test" },
			{ desc: "Test2", amt: -10, dt: "2024-01-15", vendor_name: "Test" },
			{ desc: "Test3", amt: 10, dt: "2024-01-15", vendor_name: "Test" },
		];

		const expenses = transformToExpenses(data, mappings);

		// Zero is skipped, but -10 becomes 10 (abs value)
		expect(expenses).toHaveLength(2);
		expect(expenses[0].description).toBe("Test2");
		expect(expenses[0].amount).toBe(10);
		expect(expenses[1].description).toBe("Test3");
	});

	it("handles missing optional fields", () => {
		const minimalMappings: ColumnMapping[] = [
			{ sourceColumn: "desc", targetField: "description" },
			{ sourceColumn: "amt", targetField: "amount" },
		];

		const data: RawRow[] = [{ desc: "Coffee", amt: 5.5 }];

		const expenses = transformToExpenses(data, minimalMappings);

		expect(expenses).toHaveLength(1);
		expect(expenses[0]).toEqual({
			description: "Coffee",
			amount: 5.5,
		});
	});

	it("trims whitespace from text fields", () => {
		const data: RawRow[] = [
			{
				desc: "  Coffee  ",
				amt: 5.5,
				dt: "2024-01-15",
				vendor_name: "  Test  ",
			},
		];

		const expenses = transformToExpenses(data, mappings);

		expect(expenses[0].description).toBe("Coffee");
		expect(expenses[0].vendor).toBe("Test");
	});

	it("returns empty array if no description mapping", () => {
		const incompleteMappings: ColumnMapping[] = [
			{ sourceColumn: "amt", targetField: "amount" },
		];

		const data: RawRow[] = [{ amt: 5.5 }];

		const expenses = transformToExpenses(data, incompleteMappings);

		expect(expenses).toHaveLength(0);
	});

	it("returns empty array if no amount mapping", () => {
		const incompleteMappings: ColumnMapping[] = [
			{ sourceColumn: "desc", targetField: "description" },
		];

		const data: RawRow[] = [{ desc: "Coffee" }];

		const expenses = transformToExpenses(data, incompleteMappings);

		expect(expenses).toHaveLength(0);
	});
});

// ============================================================================
// CSV Export Tests
// ============================================================================

describe("exportToCSV", () => {
	it("exports categorized expenses to CSV", () => {
		const expenses = [
			{
				originalDescription: "Starbucks Coffee",
				amount: 5.5,
				date: "2024-01-15",
				vendor: "Starbucks",
				category: "meals_entertainment",
				subcategory: "Coffee",
				taxInfo: {
					irsCategory: "Meals and Entertainment",
					scheduleLocation: "Schedule C, Line 24b",
					isDeductible: true,
					deductionPercentage: 50,
				},
				confidence: 0.95,
			},
		];

		const csv = exportToCSV(expenses);

		expect(csv).toContain("Description");
		expect(csv).toContain("Amount");
		expect(csv).toContain("Category");
		expect(csv).toContain("Starbucks Coffee");
		expect(csv).toContain("5.50");
		expect(csv).toContain("meals_entertainment");
		expect(csv).toContain("Yes"); // isDeductible
		expect(csv).toContain("95%"); // confidence
	});

	it("handles missing optional fields", () => {
		const expenses = [
			{
				originalDescription: "Test Expense",
				amount: 100.0,
				category: "office_supplies",
			},
		];

		const csv = exportToCSV(expenses);

		expect(csv).toContain("Test Expense");
		expect(csv).toContain("100.00");
		expect(csv).toContain("office_supplies");
	});

	it("exports multiple expenses", () => {
		const expenses = [
			{
				originalDescription: "Expense 1",
				amount: 10.0,
				category: "cat1",
			},
			{
				originalDescription: "Expense 2",
				amount: 20.0,
				category: "cat2",
			},
			{
				originalDescription: "Expense 3",
				amount: 30.0,
				category: "cat3",
			},
		];

		const csv = exportToCSV(expenses);
		const lines = csv.split("\n");

		// Header + 3 data rows
		expect(lines.length).toBeGreaterThanOrEqual(4);
	});

	it("properly escapes special characters", () => {
		const expenses = [
			{
				originalDescription: 'Item with "quotes" and, commas',
				amount: 50.0,
				category: "test",
			},
		];

		const csv = exportToCSV(expenses);

		// Papa.unparse should handle escaping
		expect(csv).toContain("quotes");
		expect(csv).toContain("commas");
	});
});

// ============================================================================
// File Validation Tests
// ============================================================================

describe("validateExpenseFile", () => {
	function createMockFile(name: string, size: number, type: string): File {
		const blob = new Blob([new Array(size).fill("x").join("")], { type });
		return new File([blob], name, { type });
	}

	it("accepts valid CSV file", () => {
		const file = createMockFile("expenses.csv", 1000, "text/csv");

		const result = validateExpenseFile(file);

		expect(result.valid).toBe(true);
	});

	it("accepts valid XLSX file", () => {
		const file = createMockFile(
			"expenses.xlsx",
			1000,
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		);

		const result = validateExpenseFile(file);

		expect(result.valid).toBe(true);
	});

	it("accepts valid XLS file", () => {
		const file = createMockFile(
			"expenses.xls",
			1000,
			"application/vnd.ms-excel",
		);

		const result = validateExpenseFile(file);

		expect(result.valid).toBe(true);
	});

	it("rejects file exceeding size limit", () => {
		const file = createMockFile("large.csv", 10 * 1024 * 1024, "text/csv");

		const result = validateExpenseFile(file);

		expect(result.valid).toBe(false);
		expect(result.error).toContain("exceeds");
	});

	it("respects custom size limit", () => {
		const file = createMockFile("small.csv", 2000, "text/csv");

		const result = validateExpenseFile(file, 1000);

		expect(result.valid).toBe(false);
	});

	it("rejects unsupported file extensions", () => {
		const file = createMockFile("document.pdf", 1000, "application/pdf");

		const result = validateExpenseFile(file);

		expect(result.valid).toBe(false);
		expect(result.error).toContain("Only CSV and Excel files");
	});

	it("rejects image files", () => {
		const file = createMockFile("image.png", 1000, "image/png");

		const result = validateExpenseFile(file);

		expect(result.valid).toBe(false);
	});

	it("accepts CSV with empty MIME type", () => {
		// Some browsers don't set MIME type for CSV
		const file = createMockFile("expenses.csv", 1000, "");

		const result = validateExpenseFile(file);

		expect(result.valid).toBe(true);
	});
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("end-to-end parsing workflow", () => {
	it("parses CSV and detects columns", () => {
		const csv = `Transaction Date,Description,Amount,Vendor
2024-01-15,Coffee,5.50,Starbucks
2024-01-16,Lunch,15.00,Chipotle
2024-01-17,Office Supplies,45.99,Staples`;

		const parseResult = parseCSV(csv);
		expect(parseResult.success).toBe(true);

		const mappings = detectColumnMappings(
			parseResult.headers,
			parseResult.data,
		);

		// Verify auto-detected mappings
		const dateMapping = mappings.mappings.find(
			(m) => m.targetField === "date",
		);
		const descMapping = mappings.mappings.find(
			(m) => m.targetField === "description",
		);
		const amountMapping = mappings.mappings.find(
			(m) => m.targetField === "amount",
		);
		const vendorMapping = mappings.mappings.find(
			(m) => m.targetField === "vendor",
		);

		expect(dateMapping?.sourceColumn).toBe("Transaction Date");
		expect(descMapping?.sourceColumn).toBe("Description");
		expect(amountMapping?.sourceColumn).toBe("Amount");
		expect(vendorMapping?.sourceColumn).toBe("Vendor");
	});

	it("transforms parsed data to expenses", () => {
		const csv = `Description,Amount,Date
Coffee at Starbucks,$5.50,01/15/2024
Team Lunch,$125.00,01/16/2024`;

		const parseResult = parseCSV(csv);
		const mappings = detectColumnMappings(
			parseResult.headers,
			parseResult.data,
		);
		const expenses = transformToExpenses(
			parseResult.data,
			mappings.mappings,
		);

		expect(expenses).toHaveLength(2);
		expect(expenses[0].description).toBe("Coffee at Starbucks");
		expect(expenses[0].amount).toBe(5.5);
		expect(expenses[0].date).toBe("2024-01-15");
		expect(expenses[1].amount).toBe(125);
	});
});
