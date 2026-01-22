import { addTag } from "./procedures/add-tag";
import { createFile } from "./procedures/create";
import { deleteFile } from "./procedures/delete";
import { getDownloadUrl } from "./procedures/get-download-url";
import { listFiles } from "./procedures/list";
import { listTags } from "./procedures/list-tags";
import { removeTag } from "./procedures/remove-tag";

export const filesRouter = {
	list: listFiles,
	create: createFile,
	delete: deleteFile,
	addTag,
	removeTag,
	listTags,
	getDownloadUrl,
};
