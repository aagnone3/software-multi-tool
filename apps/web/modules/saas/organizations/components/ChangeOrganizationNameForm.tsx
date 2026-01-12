"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { organizationListQueryKey } from "@saas/organizations/lib/api";
import { SettingsItem } from "@saas/shared/components/SettingsItem";
import { useRouter } from "@shared/hooks/router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
	name: z.string().min(3),
});

type FormSchema = z.infer<typeof formSchema>;

export function ChangeOrganizationNameForm() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();

	const form = useForm<FormSchema>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: activeOrganization?.name ?? "",
		},
	});

	const onSubmit = form.handleSubmit(async ({ name }) => {
		if (!activeOrganization) {
			return;
		}

		try {
			const { error } = await authClient.organization.update({
				organizationId: activeOrganization.id,
				data: {
					name,
				},
			});

			if (error) {
				throw error;
			}

			toast.success("Your organization name has been updated.");

			queryClient.invalidateQueries({
				queryKey: organizationListQueryKey,
			});
			router.refresh();
		} catch {
			toast.error(
				"We were unable to update your organization name. Please try again later.",
			);
		}
	});

	return (
		<SettingsItem title="Organization name">
			<form onSubmit={onSubmit}>
				<Input {...form.register("name")} />

				<div className="mt-4 flex justify-end">
					<Button
						type="submit"
						disabled={
							!(
								form.formState.isValid &&
								form.formState.dirtyFields.name
							)
						}
						loading={form.formState.isSubmitting}
					>
						Save
					</Button>
				</div>
			</form>
		</SettingsItem>
	);
}
