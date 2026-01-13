import { config } from "@repo/config";

export function useLocaleCurrency() {
	return config.i18n.defaultCurrency;
}
