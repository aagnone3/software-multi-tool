"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import { useSession } from "@saas/auth/hooks/use-session";
import { SettingsItem } from "@saas/shared/components/SettingsItem";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
	name: z.string().min(3),
});

type FormSchema = z.infer<typeof formSchema>;

export function ChangeNameForm() {
	const { user, reloadSession } = useSession();

	const form = useForm<FormSchema>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: user?.name ?? "",
		},
	});

	const onSubmit = form.handleSubmit(async ({ name }) => {
		const { error } = await authClient.updateUser({
			name,
		});

		if (error) {
			toast.error("Could not update name");
			return;
		}

		toast.success("Name was updated successfully");

		reloadSession();

		form.reset({
			name,
		});
	});

	return (
		<SettingsItem title="Your name">
			<form onSubmit={onSubmit}>
				<Input type="text" {...form.register("name")} />

				<div className="mt-4 flex justify-end">
					<Button
						type="submit"
						loading={form.formState.isSubmitting}
						disabled={
							!(
								form.formState.isValid &&
								form.formState.dirtyFields.name
							)
						}
					>
						Save
					</Button>
				</div>
			</form>
		</SettingsItem>
	);
}
