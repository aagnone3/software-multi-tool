import fs from "node:fs";
import chalk from "chalk";
import Table from "cli-table3";
import { openDb } from "../db";
import { type AdminEnv, audit, loadEnv } from "../env";

interface SqlOptions {
	env: AdminEnv;
	file?: string;
	sql?: string;
}

export async function sqlCommand(opts: SqlOptions): Promise<void> {
	const { env, file, sql: inlineSql } = opts;

	let sqlText: string;
	if (file && inlineSql) {
		throw new Error(
			"Pass either --file OR an inline SQL argument, not both.",
		);
	}
	if (file) {
		sqlText = fs.readFileSync(file, "utf-8");
	} else if (inlineSql) {
		sqlText = inlineSql;
	} else {
		throw new Error(
			"No SQL provided. Pass --file <path> or an inline string.",
		);
	}

	const { sourcePath } = loadEnv(env);
	console.log(chalk.dim(`env=${chalk.bold(env)}  source=${sourcePath}`));

	const client = await openDb();
	const start = Date.now();
	try {
		const result = await client.query(sqlText);
		const ms = Date.now() - start;

		if (result.rows.length === 0) {
			console.log(
				chalk.green(`✓ ${result.command ?? "OK"} (${ms}ms, 0 rows)`),
			);
		} else {
			const columns = result.fields.map((f) => f.name);
			const table = new Table({
				head: columns.map((c) => chalk.cyan(c)),
			});
			for (const row of result.rows) {
				table.push(columns.map((c) => formatCell(row[c])));
			}
			console.log(table.toString());
			console.log(
				chalk.dim(
					`(${result.rowCount ?? result.rows.length} row${result.rows.length === 1 ? "" : "s"}, ${ms}ms)`,
				),
			);
		}

		audit(
			env,
			"sql",
			`rows=${result.rows.length} ms=${ms} sql=${truncate(sqlText)}`,
		);
	} finally {
		await client.end();
	}
}

function formatCell(v: unknown): string {
	if (v === null || v === undefined) {
		return chalk.dim("∅");
	}
	if (v instanceof Date) {
		return v.toISOString();
	}
	if (typeof v === "object") {
		return JSON.stringify(v);
	}
	return String(v);
}

function truncate(s: string): string {
	const oneLine = s.replace(/\s+/g, " ").trim();
	return oneLine.length > 120 ? `${oneLine.slice(0, 117)}...` : oneLine;
}
