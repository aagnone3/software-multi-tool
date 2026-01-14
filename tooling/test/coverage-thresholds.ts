export type CoverageThresholds = {
	statements: number;
	branches: number;
	lines?: number;
	functions?: number;
};

const DEFAULT_THRESHOLDS: CoverageThresholds = {
	statements: 0,
	branches: 0,
};

const WORKSPACE_THRESHOLDS: Record<string, CoverageThresholds> = {
	"apps/web": {
		statements: 90,
		branches: 90,
	},
	config: {
		statements: 90,
		branches: 90,
	},
	"packages/ai": {
		statements: 90,
		branches: 75,
	},
	"packages/api": {
		statements: 70,
		branches: 85,
	},
	"packages/auth": {
		statements: 90,
		branches: 85,
	},
	"packages/database": {
		statements: 65,
		branches: 85,
	},
	"packages/i18n": {
		statements: 65,
		branches: 60,
	},
	"packages/logs": {
		statements: 90,
		branches: 85,
	},
	"packages/mail": {
		statements: 85,
		branches: 70,
	},
	"packages/payments": {
		statements: 90,
		branches: 85,
	},
	"packages/storage": {
		statements: 80,
		branches: 55,
	},
	"packages/utils": {
		statements: 90,
		branches: 85,
	},
	"tooling/scripts": {
		statements: 75,
		branches: 55,
	},
	"tooling/tailwind": {
		statements: 0,
		branches: 0,
	},
	"tooling/typescript": {
		statements: 0,
		branches: 0,
	},
};

export function getWorkspaceCoverageThresholds(
	workspace: string,
): CoverageThresholds {
	return WORKSPACE_THRESHOLDS[workspace] ?? DEFAULT_THRESHOLDS;
}

export function listWorkspaceCoverageThresholds(): Record<
	string,
	CoverageThresholds
> {
	return { ...WORKSPACE_THRESHOLDS };
}
