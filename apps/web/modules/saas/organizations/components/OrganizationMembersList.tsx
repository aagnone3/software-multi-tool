"use client";
import type { OrganizationMemberRole } from "@repo/auth";
import { authClient } from "@repo/auth/client";
import { isOrganizationAdmin } from "@repo/auth/lib/helper";
import { useSession } from "@saas/auth/hooks/use-session";
import { useOrganizationMemberRoles } from "@saas/organizations/hooks/member-roles";
import {
	fullOrganizationQueryKey,
	useFullOrganizationQuery,
} from "@saas/organizations/lib/api";
import { UserAvatar } from "@shared/components/UserAvatar";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@ui/components/button";
import { DataTable, useDataTable } from "@ui/components/data-table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { LogOutIcon, MoreVerticalIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";
import { OrganizationRoleSelect } from "./OrganizationRoleSelect";

export function OrganizationMembersList({
	organizationId,
}: {
	organizationId: string;
}) {
	const queryClient = useQueryClient();
	const { user } = useSession();
	const { data: organization } = useFullOrganizationQuery(organizationId);
	const memberRoles = useOrganizationMemberRoles();

	const userIsOrganizationAdmin = isOrganizationAdmin(organization, user);

	const updateMemberRole = async (
		memberId: string,
		role: OrganizationMemberRole,
	) => {
		toast.promise(
			async () => {
				await authClient.organization.updateMemberRole({
					memberId,
					role,
					organizationId,
				});
			},
			{
				loading: "Updating membership...",
				success: () => {
					queryClient.invalidateQueries({
						queryKey: fullOrganizationQueryKey(organizationId),
					});

					return "Membership was updated successfully";
				},
				error: "Could not update organization membership. Please try again.",
			},
		);
	};

	const removeMember = async (memberId: string) => {
		toast.promise(
			async () => {
				await authClient.organization.removeMember({
					memberIdOrEmail: memberId,
					organizationId,
				});
			},
			{
				loading: "Removing member from organization...",
				success: () => {
					queryClient.invalidateQueries({
						queryKey: fullOrganizationQueryKey(organizationId),
					});

					return "The member has been successfully removed from your organization.";
				},
				error: "Could not remove the member from your organization. Please try again.",
			},
		);
	};

	const columns: ColumnDef<
		NonNullable<typeof organization>["members"][number]
	>[] = [
		{
			accessorKey: "user",
			header: "",
			accessorFn: (row) => row.user,
			cell: ({ row }) =>
				row.original.user ? (
					<div className="flex items-center gap-2">
						<UserAvatar
							name={
								row.original.user.name ??
								row.original.user.email
							}
							avatarUrl={row.original.user?.image}
						/>
						<div>
							<strong className="block">
								{row.original.user.name}
							</strong>
							<small className="text-foreground/60">
								{row.original.user.email}
							</small>
						</div>
					</div>
				) : null,
		},
		{
			accessorKey: "actions",
			header: "",
			cell: ({ row }) => {
				return (
					<div className="flex flex-row justify-end gap-2">
						{userIsOrganizationAdmin ? (
							<>
								<OrganizationRoleSelect
									value={row.original.role}
									onSelect={async (value) =>
										updateMemberRole(row.original.id, value)
									}
									disabled={
										!userIsOrganizationAdmin ||
										row.original.role === "owner"
									}
								/>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button size="icon" variant="ghost">
											<MoreVerticalIcon className="size-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										{row.original.userId !== user?.id && (
											<DropdownMenuItem
												disabled={
													!isOrganizationAdmin(
														organization,
														user,
													)
												}
												className="text-destructive"
												onClick={async () =>
													removeMember(
														row.original.id,
													)
												}
											>
												<TrashIcon className="mr-2 size-4" />
												Remove member
											</DropdownMenuItem>
										)}
										{row.original.userId === user?.id && (
											<DropdownMenuItem
												className="text-destructive"
												onClick={async () =>
													removeMember(
														row.original.id,
													)
												}
											>
												<LogOutIcon className="mr-2 size-4" />
												Leave organization
											</DropdownMenuItem>
										)}
									</DropdownMenuContent>
								</DropdownMenu>
							</>
						) : (
							<span className="font-medium text-foreground/60 text-sm">
								{
									memberRoles[
										row.original
											.role as keyof typeof memberRoles
									]
								}
							</span>
						)}
					</div>
				);
			},
		},
	];

	const { table } = useDataTable({
		data: organization?.members ?? [],
		columns,
		enablePagination: true,
		enableSorting: true,
		enableFiltering: true,
		manualPagination: true,
	});

	return (
		<DataTable
			table={table}
			columns={columns.length}
			emptyMessage="No results."
			hideHeaders
		/>
	);
}
