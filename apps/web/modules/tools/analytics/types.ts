/**
 * Tool Analytics Event Types
 *
 * This file defines all analytics events for tool usage tracking.
 * Events are designed to track both anonymous and authenticated user behavior
 * while maintaining privacy compliance (no PII in anonymous tracking).
 */

/**
 * Tool usage events
 */
export type ToolUsageEvent =
	| "tool_viewed"
	| "tool_upload_started"
	| "tool_processing_started"
	| "tool_processing_completed"
	| "tool_processing_failed"
	| "tool_result_downloaded";

/**
 * Conversion events
 */
export type ConversionEvent =
	| "credits_purchase_started"
	| "credits_purchase_completed"
	| "account_created_from_tool";

/**
 * All tool analytics events
 */
export type ToolAnalyticsEvent = ToolUsageEvent | ConversionEvent;

/**
 * Common properties attached to all tool events
 */
export interface ToolEventProperties {
	/** Which tool was used (e.g., "news-analyzer") */
	tool_name: string;
	/** Anonymous session identifier */
	session_id?: string;
	/** Input type for the tool (e.g., "url", "text", "file") */
	input_type?: string;
	/** Whether the user is authenticated */
	is_authenticated?: boolean;
}

/**
 * Properties for tool_viewed event
 */
export interface ToolViewedProperties extends ToolEventProperties {
	/** Page URL or route */
	page_path?: string;
	/** Referrer source */
	referrer?: string;
}

/**
 * Properties for tool_upload_started event
 */
export interface ToolUploadStartedProperties extends ToolEventProperties {
	/** File type if applicable */
	file_type?: string;
	/** File size in bytes */
	file_size?: number;
}

/**
 * Properties for tool_processing_started event
 */
export interface ToolProcessingStartedProperties extends ToolEventProperties {
	/** Job ID for tracking */
	job_id: string;
	/** Whether this is from cache */
	from_cache?: boolean;
}

/**
 * Properties for tool_processing_completed event
 */
export interface ToolProcessingCompletedProperties extends ToolEventProperties {
	/** Job ID for tracking */
	job_id: string;
	/** Processing duration in milliseconds */
	processing_duration_ms: number;
	/** Whether result was from cache */
	from_cache?: boolean;
}

/**
 * Properties for tool_processing_failed event
 */
export interface ToolProcessingFailedProperties extends ToolEventProperties {
	/** Job ID for tracking */
	job_id: string;
	/** Error code or type (not full message to avoid PII) */
	error_type?: string;
	/** Processing duration before failure in milliseconds */
	processing_duration_ms?: number;
}

/**
 * Properties for tool_result_downloaded event
 */
export interface ToolResultDownloadedProperties extends ToolEventProperties {
	/** Job ID for tracking */
	job_id: string;
	/** Download format (e.g., "json", "pdf", "csv") */
	download_format?: string;
}

/**
 * Properties for credits_purchase_started event
 */
export interface CreditsPurchaseStartedProperties extends ToolEventProperties {
	/** Credit package selected */
	credit_package?: string;
	/** Price in cents */
	price_cents?: number;
}

/**
 * Properties for credits_purchase_completed event
 */
export interface CreditsPurchaseCompletedProperties
	extends ToolEventProperties {
	/** Credit package purchased */
	credit_package?: string;
	/** Amount of credits */
	credits_amount?: number;
	/** Price in cents */
	price_cents?: number;
}

/**
 * Properties for account_created_from_tool event
 */
export interface AccountCreatedFromToolProperties extends ToolEventProperties {
	/** Signup method used */
	signup_method?: "email" | "google" | "github";
	/** Previous session ID before account creation */
	previous_session_id?: string;
}

/**
 * Union of all event properties by event type
 */
export type ToolEventPropertiesMap = {
	tool_viewed: ToolViewedProperties;
	tool_upload_started: ToolUploadStartedProperties;
	tool_processing_started: ToolProcessingStartedProperties;
	tool_processing_completed: ToolProcessingCompletedProperties;
	tool_processing_failed: ToolProcessingFailedProperties;
	tool_result_downloaded: ToolResultDownloadedProperties;
	credits_purchase_started: CreditsPurchaseStartedProperties;
	credits_purchase_completed: CreditsPurchaseCompletedProperties;
	account_created_from_tool: AccountCreatedFromToolProperties;
};
