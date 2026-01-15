import { getBalance } from "./procedures/get-balance";
import { getHistory } from "./procedures/get-history";
import { getUsageStatsEndpoint } from "./procedures/get-usage-stats";

export const creditsRouter = {
	balance: getBalance,
	history: getHistory,
	usageStats: getUsageStatsEndpoint,
};
