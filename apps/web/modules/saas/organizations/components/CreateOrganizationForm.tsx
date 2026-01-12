"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import {
	organizationListQueryKey,
	useCreateOrganizationMutation,
} from "@saas/organizations/lib/api";
import { useRouter } from "@shared/hooks/router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/form";
import { Input } from "@ui/components/input";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
	name: z.string().min(3).max(32),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateOrganizationForm({
	defaultName,
}: {
	defaultName?: string;
}) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { setActiveOrganization } = useActiveOrganization();
	const createOrganizationMutation = useCreateOrganizationMutation();
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: defaultName ?? "",
		},
	});

	const onSubmit = form.handleSubmit(async ({ name }) => {
		try {
			const newOrganization =
				await createOrganizationMutation.mutateAsync({
					name,
				});

			if (!newOrganization) {
				throw new Error("Failed to create organization");
			}

			await setActiveOrganization(newOrganization.slug);

			await queryClient.invalidateQueries({
				queryKey: organizationListQueryKey,
			});

			router.replace(`/app/${newOrganization.slug}`);
		} catch {
			toast.error(
				"We are sorry, but we were unable to create your organization. Please try again later.",
			);
		}
	});

	return (
		<div className="mx-auto w-full max-w-md">
			<h1 className="font-bold text-xl md:text-2xl">
				Create an organization
			</h1>
			<p className="mt-2 mb-6 text-foreground/60">
				Enter a name for your organization to get started. You can
				change the name later in the organization settings.
			</p>

			<Form {...form}>
				<form onSubmit={onSubmit}>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Organization name</FormLabel>
								<FormControl>
									<Input {...field} autoComplete="email" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button
						className="mt-6 w-full"
						type="submit"
						loading={form.formState.isSubmitting}
					>
						Create organization
					</Button>
				</form>
			</Form>
		</div>
	);
}
