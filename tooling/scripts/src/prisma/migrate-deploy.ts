import { spawn } from "node:child_process";
import process from "node:process";

function resolveDatabaseUrl(): string {
	const databaseUrl =
		process.env.DATABASE_URL ?? process.env.PROD_DATABASE_URL ?? "";

	if (!databaseUrl) {
		console.error(
			"[db:migrate:deploy] DATABASE_URL (or PROD_DATABASE_URL) is required.",
		);
		process.exit(1);
	}

	return databaseUrl;
}

async function run(command: string, args: string[], env: NodeJS.ProcessEnv) {
	await new Promise<void>((resolve, reject) => {
		const child = spawn(command, args, {
			stdio: "inherit",
			shell: false,
			env,
		});

		child.on("exit", (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(
					new Error(
						`Command "${command} ${args.join(" ")}" exited with code ${code}`,
					),
				);
			}
		});

		child.on("error", reject);
	});
}

async function main() {
	const databaseUrl = resolveDatabaseUrl();
	const directUrl = process.env.DIRECT_URL ?? databaseUrl;

	const env = {
		...process.env,
		DATABASE_URL: databaseUrl,
		DIRECT_URL: directUrl,
	};

	console.info("[db:migrate:deploy] Applying Prisma migrations...");
	await run(
		"pnpm",
		[
			"--filter",
			"@repo/database",
			"exec",
			"prisma",
			"migrate",
			"deploy",
			"--schema=./prisma/schema.prisma",
		],
		env,
	);
	console.info("[db:migrate:deploy] Migrations applied successfully.");
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
