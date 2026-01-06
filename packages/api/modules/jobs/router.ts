import { cancelJob } from "./procedures/cancel-job";
import { createJob } from "./procedures/create-job";
import { getJob } from "./procedures/get-job";
import { listJobs } from "./procedures/list-jobs";

export const jobsRouter = {
	create: createJob,
	get: getJob,
	list: listJobs,
	cancel: cancelJob,
};
