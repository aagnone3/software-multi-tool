"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Label } from "@ui/components/label";
import { Switch } from "@ui/components/switch";
import { toast } from "sonner";

interface ChannelPreferences {
	inApp: boolean;
	email: boolean;
}

interface NotificationPreferencesData {
	billing: ChannelPreferences;
	security: ChannelPreferences;
	team: ChannelPreferences;
	system: ChannelPreferences;
}

const CATEGORIES = [
	{
		key: "billing" as const,
		label: "Billing",
		description:
			"Payment confirmations, subscription updates, and invoices",
	},
	{
		key: "security" as const,
		label: "Security",
		description:
			"Login alerts, password changes, and security notifications",
	},
	{
		key: "team" as const,
		label: "Team",
		description:
			"Team invitations, member updates, and organization changes",
	},
	{
		key: "system" as const,
		label: "System",
		description: "Maintenance notices, feature updates, and announcements",
	},
] as const;

const CHANNELS = [
	{ key: "inApp" as const, label: "In-App" },
	{ key: "email" as const, label: "Email" },
] as const;

export function NotificationPreferencesForm() {
	const queryClient = useQueryClient();

	const { data, isLoading, error } = useQuery(
		orpc.notifications.getPreferences.queryOptions({ input: {} }),
	);

	const updateMutation = useMutation(
		orpc.notifications.updatePreferences.mutationOptions(),
	);

	const handleToggle = async (
		category: keyof NotificationPreferencesData,
		channel: keyof ChannelPreferences,
		checked: boolean,
	) => {
		if (!data?.preferences) {
			return;
		}

		const currentPrefs = data.preferences[category];
		const updatedPrefs = {
			...currentPrefs,
			[channel]: checked,
		};

		try {
			await updateMutation.mutateAsync({
				[category]: updatedPrefs,
			});

			// Optimistically update the cache
			queryClient.setQueryData(
				orpc.notifications.getPreferences.queryOptions({ input: {} })
					.queryKey,
				{
					preferences: {
						...data.preferences,
						[category]: updatedPrefs,
					},
				},
			);

			toast.success("Preferences updated");
		} catch {
			toast.error("Failed to update preferences");
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="text-sm text-foreground/60">
					Loading preferences...
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="text-sm text-destructive">
					Failed to load preferences
				</div>
			</div>
		);
	}

	const preferences = data?.preferences;

	return (
		<div className="space-y-6">
			{/* Header row with channel labels */}
			<div className="grid grid-cols-[1fr_80px_80px] gap-4 items-center pb-2 border-b">
				<div className="text-sm font-medium text-foreground/60">
					Category
				</div>
				{CHANNELS.map((channel) => (
					<div
						key={channel.key}
						className="text-sm font-medium text-foreground/60 text-center"
					>
						{channel.label}
					</div>
				))}
			</div>

			{/* Preference rows */}
			{CATEGORIES.map((category) => (
				<div
					key={category.key}
					className="grid grid-cols-[1fr_80px_80px] gap-4 items-center"
				>
					<div>
						<Label className="text-sm font-medium">
							{category.label}
						</Label>
						<p className="text-xs text-foreground/60 mt-0.5">
							{category.description}
						</p>
					</div>
					{CHANNELS.map((channel) => {
						const isChecked =
							preferences?.[category.key]?.[channel.key] ?? false;
						const isUpdating =
							updateMutation.isPending &&
							updateMutation.variables?.[category.key] !==
								undefined;

						return (
							<div
								key={channel.key}
								className="flex justify-center"
							>
								<Switch
									checked={isChecked}
									onCheckedChange={(checked) =>
										handleToggle(
											category.key,
											channel.key,
											checked,
										)
									}
									disabled={isUpdating}
									aria-label={`${category.label} ${channel.label} notifications`}
								/>
							</div>
						);
					})}
				</div>
			))}
		</div>
	);
}
