"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	CheckCircle2Icon,
	ClockIcon,
	DownloadIcon,
	Loader2Icon,
	XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";
import { SettingsItem } from "../../shared/components/SettingsItem";

// Query key for export list
const gdprExportsQueryKey = ["gdpr-exports"] as const;

export function DataExportForm() {
	const queryClient = useQueryClient();

	// Fetch recent exports
	const { data: exportsData, isLoading: isLoadingExports } = useQuery({
		queryKey: gdprExportsQueryKey,
		queryFn: async () => {
			return orpcClient.gdpr.listExports({
				limit: 5,
				offset: 0,
			});
		},
	});

	// Request export mutation
	const requestExportMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.gdpr.requestExport({
				format: "json",
			});
		},
		onSuccess: (data) => {
			toast.success(data.message);
			// Refresh the exports list
			queryClient.invalidateQueries({ queryKey: gdprExportsQueryKey });
		},
		onError: (error) => {
			if (error.message?.includes("24 hours")) {
				toast.error(error.message);
			} else {
				toast.error("Failed to request data export. Please try again.");
			}
		},
	});

	// Check if there's an active export
	const activeExport = exportsData?.exports.find(
		(exp) => exp.status === "PENDING" || exp.status === "PROCESSING",
	);

	// Check if there's a recent completed export with valid download URL
	const recentCompletedExport = exportsData?.exports.find((exp) => {
		if (exp.status !== "COMPLETED" || !exp.downloadUrl || !exp.expiresAt) {
			return false;
		}
		// Check if download URL is still valid
		return new Date(exp.expiresAt) > new Date();
	});

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "COMPLETED":
				return <CheckCircle2Icon className="size-4 text-green-500" />;
			case "FAILED":
				return <XCircleIcon className="size-4 text-red-500" />;
			case "PENDING":
			case "PROCESSING":
				return (
					<Loader2Icon className="size-4 animate-spin text-blue-500" />
				);
			default:
				return <ClockIcon className="size-4 text-gray-500" />;
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString(undefined, {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<SettingsItem
			title="Export your data"
			description="Download a copy of all your personal data. This includes your profile, organization memberships, purchase history, and usage data. The export will be generated as a JSON file and delivered via a secure download link. Rate limited to one request per 24 hours."
		>
			<div className="flex flex-col gap-4">
				{/* Request Export Button */}
				<div className="flex items-center gap-4">
					<Button
						onClick={() => requestExportMutation.mutate()}
						disabled={
							requestExportMutation.isPending ||
							!!activeExport ||
							isLoadingExports
						}
					>
						{requestExportMutation.isPending ? (
							<>
								<Loader2Icon className="mr-2 size-4 animate-spin" />
								Requesting...
							</>
						) : activeExport ? (
							<>
								<Loader2Icon className="mr-2 size-4 animate-spin" />
								Export in progress
							</>
						) : (
							<>
								<DownloadIcon className="mr-2 size-4" />
								Request data export
							</>
						)}
					</Button>

					{recentCompletedExport && (
						<a
							href={recentCompletedExport.downloadUrl}
							className="text-sm text-primary hover:underline flex items-center gap-1"
							download
						>
							<DownloadIcon className="size-3" />
							Download latest export
						</a>
					)}
				</div>

				{/* Export History */}
				{exportsData && exportsData.exports.length > 0 && (
					<div className="mt-2">
						<h4 className="text-sm font-medium text-foreground/80 mb-2">
							Recent exports
						</h4>
						<div className="space-y-2">
							{exportsData.exports.slice(0, 5).map((exp) => (
								<div
									key={exp.jobId}
									className="flex items-center justify-between gap-4 text-sm text-foreground/60 border rounded-lg px-3 py-2"
								>
									<div className="flex items-center gap-2">
										{getStatusIcon(exp.status)}
										<span>{formatDate(exp.createdAt)}</span>
										{exp.totalRecords && (
											<span className="text-xs">
												({exp.totalRecords} records)
											</span>
										)}
									</div>
									<div>
										{exp.status === "COMPLETED" &&
											exp.downloadUrl &&
											exp.expiresAt &&
											new Date(exp.expiresAt) >
												new Date() && (
												<a
													href={exp.downloadUrl}
													className="text-primary hover:underline flex items-center gap-1"
													download
												>
													<DownloadIcon className="size-3" />
													Download
												</a>
											)}
										{exp.status === "COMPLETED" &&
											exp.expiresAt &&
											new Date(exp.expiresAt) <=
												new Date() && (
												<span className="text-foreground/40">
													Expired
												</span>
											)}
										{exp.status === "FAILED" && (
											<span className="text-red-500 text-xs">
												{exp.error || "Failed"}
											</span>
										)}
										{(exp.status === "PENDING" ||
											exp.status === "PROCESSING") && (
											<span className="text-blue-500 text-xs">
												Processing...
											</span>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Privacy Notice */}
				<p className="text-xs text-foreground/50 mt-2">
					Under GDPR Article 20, you have the right to receive your
					personal data in a portable format. Your export will be
					ready within a few minutes and you will receive an email
					notification. The download link is valid for 24 hours.
				</p>
			</div>
		</SettingsItem>
	);
}
