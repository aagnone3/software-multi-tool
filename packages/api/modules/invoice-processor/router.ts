import { createInvoiceUploadUrl } from "./procedures/create-invoice-upload-url";

export const invoiceProcessorRouter = {
	uploadUrl: createInvoiceUploadUrl,
};
