import { cancelJob } from "./procedures/cancel-job";
import { createJob } from "./procedures/create-job";
import { getJob } from "./procedures/get-job";
import { listJobs } from "./procedures/list-jobs";
import { streamJob } from "./procedures/stream-job";

export const jobsRouter = {
	create: createJob,
	get: getJob,
	stream: streamJob,
	list: listJobs,
	cancel: cancelJob,
};
