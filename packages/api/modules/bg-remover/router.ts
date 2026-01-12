/**
 * Background Remover Module
 *
 * This module uses the generic jobs API for creating and managing jobs.
 * The tool-specific logic is in the processor.
 *
 * To use this tool:
 * 1. Create a job via POST /api/jobs with toolSlug: "bg-remover"
 * 2. Poll job status via GET /api/jobs/{jobId}
 * 3. Download result when status is "COMPLETED"
 */

export const bgRemoverRouter = {};

// Note: This module uses the generic /api/jobs endpoints
// No tool-specific API procedures are needed
