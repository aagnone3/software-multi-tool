import { describe, expect, it } from "vitest";
import {
	detectDelimiter,
	normalizeDate,
	parseAmount,
	parseCSV,
	transformToExpenses,
	validateExpenseFile,
} from "./expense-file-parser";

describe("detectDelimiter", () => {
	it("detects comma delimiter", () => {
		const csv = "name,amount,date\nFoo,100,2024-01-01\nBar,200,2024-01-02";
		expect(detectDelimiter(csv)).toBe(",");
	});

	it("detects semicolon delimiter", () => {
		const csv = "name;amount;date\nFoo;100;2024-01-01\nBar;200;2024-01-02";
		expect(detectDelimiter(csv)).toBe(";");
	});

	it("detects tab delimiter", () => {
		const csv = "name\tamount\tdate\nFoo\t100\t2024-01-01";
		expect(detectDelimiter(csv)).toBe("\t");
	});

	it("detects pipe delimiter", () => {
		const csv = "name|amount|date\nFoo|100|2024-01-01\nBar|200|2024-01-02";
		expect(detectDelimiter(csv)).toBe("|");
	});

	it("defaults to comma for ambiguous input", () => {
		expect(detectDelimiter("")).toBe(",");
	});
});

describe("parseCSV", () => {
	it("parses a simple CSV", () => {
		const content = "description,amount\nCoffee,5.50\nLunch,12.00";
		const result = parseCSV(content);
		expect(result.success).toBe(true);
		expect(result.headers).toEqual(["description", "amount"]);
		expect(result.data).toHaveLength(2);
		expect(result.data[0]).toMatchObject({
			description: "Coffee",
			amount: 5.5,
		});
	});

	it("auto-detects semicolon delimiter", () => {
		const content = "description;amount\nCoffee;5.50\nLunch;12.00";
		const result = parseCSV(content);
		expect(result.success).toBe(true);
		expect(result.detectedDelimiter).toBe(";");
		expect(result.data).toHaveLength(2);
	});

	it("uses provided delimiter over auto-detection", () => {
		const content = "description|amount\nCoffee|5.50";
		const result = parseCSV(content, "|");
		expect(result.success).toBe(true);
		expect(result.detectedDelimiter).toBe("|");
	});

	it("trims whitespace from headers", () => {
		const content = " description , amount \nCoffee,5.50";
		const result = parseCSV(content);
		expect(result.headers).toEqual(["description", "amount"]);
	});
});

describe("parseAmount", () => {
	it("parses a plain number", () => {
		expect(parseAmount(42.5)).toBe(42.5);
	});

	it("parses a string number", () => {
		expect(parseAmount("99.99")).toBe(99.99);
	});

	it("removes dollar sign", () => {
		expect(parseAmount("$12.34")).toBe(12.34);
	});

	it("removes euro sign", () => {
		expect(parseAmount("€50.00")).toBe(50.0);
	});

	it("removes pound sign", () => {
		expect(parseAmount("£25.00")).toBe(25.0);
	});

	it("removes commas from thousands", () => {
		expect(parseAmount("1,234.56")).toBe(1234.56);
	});

	it("handles parentheses as positive value", () => {
		expect(parseAmount("(100.00)")).toBe(100.0);
	});

	it("returns null for null input", () => {
		expect(parseAmount(null)).toBeNull();
	});

	it("returns null for non-numeric string", () => {
		expect(parseAmount("not-a-number")).toBeNull();
	});
});

describe("normalizeDate", () => {
	it("normalizes ISO date string", () => {
		expect(normalizeDate("2024-03-15")).toBe("2024-03-15");
	});

	it("normalizes US slash format MM/DD/YYYY", () => {
		const result = normalizeDate("03/15/2024");
		expect(result).toBe("2024-03-15");
	});

	it("normalizes 2-digit year with century heuristic", () => {
		// year 51 → 1951
		const result = normalizeDate("01/01/51");
		expect(result).toMatch(/^195\d-/);
	});

	it("returns null for null input", () => {
		expect(normalizeDate(null)).toBeNull();
	});

	it("returns null for unparseable input", () => {
		expect(normalizeDate("not-a-date")).toBeNull();
	});
});

describe("transformToExpenses", () => {
	const data = [
		{ desc: "Coffee", amt: "5.50", dt: "2024-01-01", ven: "Starbucks" },
		{ desc: "Lunch", amt: "12.00", dt: "2024-01-02", ven: "" },
		{ desc: "Bad row", amt: "", dt: "", ven: "" },
	];

	const mappings = [
		{ sourceColumn: "desc", targetField: "description" as const },
		{ sourceColumn: "amt", targetField: "amount" as const },
		{ sourceColumn: "dt", targetField: "date" as const },
		{ sourceColumn: "ven", targetField: "vendor" as const },
	];

	it("transforms rows with all fields", () => {
		const expenses = transformToExpenses(data, mappings);
		expect(expenses).toHaveLength(2); // row with empty amt is excluded
		expect(expenses[0]).toMatchObject({
			description: "Coffee",
			amount: 5.5,
			date: "2024-01-01",
			vendor: "Starbucks",
		});
	});

	it("skips rows with missing amount", () => {
		const expenses = transformToExpenses(data, mappings);
		expect(expenses.every((e) => e.amount > 0)).toBe(true);
	});

	it("skips rows with zero amount after parsing", () => {
		const zeroData = [{ desc: "Free item", amt: "0.00", dt: "", ven: "" }];
		const expenses = transformToExpenses(zeroData, mappings);
		expect(expenses).toHaveLength(0);
	});

	it("omits vendor when column value is empty", () => {
		const expenses = transformToExpenses(data, mappings);
		expect(expenses[1].vendor).toBeUndefined();
	});

	it("returns empty array when description mapping is missing", () => {
		const noDesc = mappings.filter((m) => m.targetField !== "description");
		const expenses = transformToExpenses(data, noDesc);
		expect(expenses).toHaveLength(0);
	});
});

describe("validateExpenseFile", () => {
	it("accepts CSV files", () => {
		const file = new File(["content"], "expenses.csv", {
			type: "text/csv",
		});
		const result = validateExpenseFile(file);
		expect(result.valid).toBe(true);
	});

	it("accepts XLSX files", () => {
		const file = new File(["content"], "expenses.xlsx", {
			type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		});
		const result = validateExpenseFile(file);
		expect(result.valid).toBe(true);
	});

	it("rejects unsupported file types", () => {
		const file = new File(["content"], "expenses.pdf", {
			type: "application/pdf",
		});
		const result = validateExpenseFile(file);
		expect(result.valid).toBe(false);
		expect(result.error).toBeDefined();
	});

	it("rejects files over size limit", () => {
		// Create a file with a large size property by overriding
		const file = new File(["content"], "expenses.csv", {
			type: "text/csv",
		});
		Object.defineProperty(file, "size", { value: 100 * 1024 * 1024 });
		const result = validateExpenseFile(file);
		expect(result.valid).toBe(false);
	});
});
