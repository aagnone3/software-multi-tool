import { exportAuditLogs } from "./procedures/export-audit-logs";
import {
	getAuditLogFilters,
	listAuditLogs,
} from "./procedures/list-audit-logs";

export const auditLogsRouter = {
	list: listAuditLogs,
	filters: getAuditLogFilters,
	export: exportAuditLogs,
};
