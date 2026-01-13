import { getExportStatus } from "./procedures/get-export-status";
import { listExports } from "./procedures/list-exports";
import { requestExport } from "./procedures/request-export";

export const gdprRouter = {
	requestExport,
	getExportStatus,
	listExports,
};
