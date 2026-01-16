// Local storage provider
export {
	createLocalStorageProvider,
	LocalStorageProvider,
	shouldUseLocalStorage,
} from "./local";

// S3 storage provider (class only - legacy functions exported from main index.ts with auto-detection)
export { S3StorageProvider } from "./s3";

// Supabase storage provider
export {
	createSupabaseStorageProvider,
	getDefaultSupabaseProvider,
	SupabaseStorageProvider,
	shouldUseSupabaseStorage,
} from "./supabase";
