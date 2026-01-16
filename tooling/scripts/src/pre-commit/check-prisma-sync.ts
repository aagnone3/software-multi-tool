import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const MARKER_FILES = ["pnpm-workspace.yaml", "turbo.json"];

export const REPO_ROOT =
	locateRepoRoot(process.env.INIT_CWD) ??
	locateRepoRoot(process.cwd()) ??
	locateRepoRoot(path.join(__dirname, "..", "..", "..", "..")) ??
	path.resolve(path.join(__dirname, "..", "..", "..", ".."));

export const PRISMA_SCHEMA_PATH = path.join(
	REPO_ROOT,
	"packages/database/prisma/schema.prisma",
);
export const PRISMA_ZOD_DIR = path.join(
	REPO_ROOT,
	"packages/database/prisma/zod",
);

function locateRepoRoot(start: string | undefined): string | null {
	if (!start) {
		return null;
	}

	let current = path.resolve(start);
	while (true) {
		for (const marker of MARKER_FILES) {
			if (fs.existsSync(path.join(current, marker))) {
				return current;
			}
		}

		const parent = path.dirname(current);
		if (parent === current) {
			return null;
		}
		current = parent;
	}
}

export function computeFileHash(filePath: string): string | null {
	try {
		const content = fs.readFileSync(filePath);
		return crypto.createHash("sha256").update(content).digest("hex");
	} catch {
		return null;
	}
}

export function computeDirectoryHash(dirPath: string): string | null {
	try {
		if (!fs.existsSync(dirPath)) {
			return null;
		}

		const hash = crypto.createHash("sha256");
		const files = fs.readdirSync(dirPath).sort();

		for (const file of files) {
			const filePath = path.join(dirPath, file);
			const stat = fs.statSync(filePath);

			if (stat.isFile()) {
				const content = fs.readFileSync(filePath);
				hash.update(`${file}:${content.length}:`);
				hash.update(content);
			}
		}

		return hash.digest("hex");
	} catch {
		return null;
	}
}

function getStagedFiles(): string[] {
	const result = spawnSync("git", ["diff", "--cached", "--name-only"], {
		cwd: REPO_ROOT,
		encoding: "utf8",
	});

	if (result.status !== 0 || !result.stdout) {
		return [];
	}

	return result.stdout
		.split("\n")
		.map((f) => f.trim())
		.filter(Boolean);
}

export function hasStagedPrismaChanges(stagedFiles: string[]): boolean {
	return stagedFiles.some(
		(file) =>
			file.includes("packages/database/prisma/schema.prisma") ||
			file.includes("packages/database/prisma/migrations/"),
	);
}

function hasUnstagedZodChanges(): boolean {
	const result = spawnSync(
		"git",
		["diff", "--name-only", "--", "packages/database/prisma/zod/"],
		{
			cwd: REPO_ROOT,
			encoding: "utf8",
		},
	);

	return result.status === 0 && result.stdout.trim().length > 0;
}

function runPrismaGenerate(): { success: boolean; output: string } {
	const result = spawnSync(
		"pnpm",
		["--filter", "@repo/database", "generate"],
		{
			cwd: REPO_ROOT,
			encoding: "utf8",
			timeout: 30000, // 30 second timeout
		},
	);

	const output = [result.stdout, result.stderr].filter(Boolean).join("\n");

	return {
		success: result.status === 0,
		output,
	};
}

export function main(_argv: string[]): number {
	const stagedFiles = getStagedFiles();

	// Only run check if Prisma-related files are staged
	if (!hasStagedPrismaChanges(stagedFiles)) {
		console.log(
			"[pre-commit] No Prisma changes staged. Skipping sync check.",
		);
		return 0;
	}

	console.log(
		"[pre-commit] Prisma changes detected. Verifying client sync...",
	);

	// Compute hash of schema before generate
	const schemaHashBefore = computeFileHash(PRISMA_SCHEMA_PATH);
	if (!schemaHashBefore) {
		console.error(
			"[pre-commit] Warning: Could not read Prisma schema. Skipping sync check.",
		);
		return 0;
	}

	// Compute hash of generated files before
	const zodHashBefore = computeDirectoryHash(PRISMA_ZOD_DIR);

	// Run prisma generate
	console.log("[pre-commit] Running prisma generate...");
	const { success, output } = runPrismaGenerate();

	if (!success) {
		console.error("[pre-commit] prisma generate failed:");
		console.error(output);
		return 1;
	}

	// Compute hash of generated files after
	const zodHashAfter = computeDirectoryHash(PRISMA_ZOD_DIR);

	// If hashes are the same, everything is in sync
	if (zodHashBefore === zodHashAfter) {
		console.log("[pre-commit] Prisma client is in sync with schema.");
		return 0;
	}

	// If Zod files changed, check if they're staged
	if (hasUnstagedZodChanges()) {
		console.error("");
		console.error(
			"❌ Prisma generated files are out of sync with schema.prisma",
		);
		console.error("");
		console.error(
			"The Zod schemas in packages/database/prisma/zod/ have been updated",
		);
		console.error("by `prisma generate` but are not staged for commit.");
		console.error("");
		console.error("To fix this, run:");
		console.error("");
		console.error("  git add packages/database/prisma/zod/");
		console.error("");
		console.error("Then retry your commit.");
		console.error("");
		return 1;
	}

	console.log(
		"[pre-commit] Prisma generate updated files. Changes are staged.",
	);
	return 0;
}

const modulePathArg = process.argv[1];
if (
	typeof modulePathArg === "string" &&
	import.meta.url === pathToFileURL(modulePathArg).href
) {
	process.exitCode = main(process.argv.slice(2));
}
