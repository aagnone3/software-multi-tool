import { registerProcessor } from "../../jobs/lib/processor-registry";
import { processExpenseJob } from "./processor";

export function registerExpenseProcessor() {
	registerProcessor("expense-categorizer", processExpenseJob);
}
