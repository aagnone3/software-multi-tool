import { createSessionProcedure } from "./procedures/create-session";
import { executeTurnProcedure } from "./procedures/execute-turn";
import { getSessionProcedure } from "./procedures/get-session";

export const agentSessionsRouter = {
	create: createSessionProcedure,
	get: getSessionProcedure,
	executeTurn: executeTurnProcedure,
};
