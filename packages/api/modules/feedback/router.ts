import { createFeedbackProcedure } from "./procedures/create-feedback";
import { getFeedbackForJobProcedure } from "./procedures/get-feedback-for-job";
import { getFeedbackStatsProcedure } from "./procedures/get-feedback-stats";
import { listFeedbackProcedure } from "./procedures/list-feedback";
import { updateFeedbackProcedure } from "./procedures/update-feedback";

export const feedbackRouter = {
	create: createFeedbackProcedure,
	getForJob: getFeedbackForJobProcedure,
	list: listFeedbackProcedure,
	stats: getFeedbackStatsProcedure,
	update: updateFeedbackProcedure,
};
