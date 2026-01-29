import type { Meta } from "@storybook/react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { MoreHorizontalIcon } from "lucide-react";
import { DataTable } from "./data-table";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTablePagination } from "./data-table-pagination";
import {
	DataTableSelectAll,
	DataTableSelectRow,
} from "./data-table-row-selection";
import { DataTableViewOptions } from "./data-table-view-options";
import { useDataTable } from "./use-data-table";

interface User {
	id: string;
	name: string;
	email: string;
	status: "active" | "inactive" | "pending";
	role: string;
	createdAt: Date;
}

const sampleData: User[] = [
	{
		id: "1",
		name: "Alice Johnson",
		email: "alice@example.com",
		status: "active",
		role: "Admin",
		createdAt: new Date("2024-01-15"),
	},
	{
		id: "2",
		name: "Bob Smith",
		email: "bob@example.com",
		status: "active",
		role: "User",
		createdAt: new Date("2024-02-20"),
	},
	{
		id: "3",
		name: "Charlie Brown",
		email: "charlie@example.com",
		status: "inactive",
		role: "User",
		createdAt: new Date("2024-03-10"),
	},
	{
		id: "4",
		name: "Diana Ross",
		email: "diana@example.com",
		status: "pending",
		role: "Moderator",
		createdAt: new Date("2024-04-05"),
	},
	{
		id: "5",
		name: "Edward Norton",
		email: "edward@example.com",
		status: "active",
		role: "User",
		createdAt: new Date("2024-05-01"),
	},
	{
		id: "6",
		name: "Fiona Apple",
		email: "fiona@example.com",
		status: "active",
		role: "Admin",
		createdAt: new Date("2024-06-12"),
	},
	{
		id: "7",
		name: "George Lucas",
		email: "george@example.com",
		status: "inactive",
		role: "User",
		createdAt: new Date("2024-07-08"),
	},
	{
		id: "8",
		name: "Helen Mirren",
		email: "helen@example.com",
		status: "active",
		role: "Moderator",
		createdAt: new Date("2024-08-22"),
	},
	{
		id: "9",
		name: "Ivan Petrov",
		email: "ivan@example.com",
		status: "pending",
		role: "User",
		createdAt: new Date("2024-09-30"),
	},
	{
		id: "10",
		name: "Julia Roberts",
		email: "julia@example.com",
		status: "active",
		role: "User",
		createdAt: new Date("2024-10-15"),
	},
	{
		id: "11",
		name: "Kevin Hart",
		email: "kevin@example.com",
		status: "active",
		role: "Admin",
		createdAt: new Date("2024-11-01"),
	},
	{
		id: "12",
		name: "Laura Dern",
		email: "laura@example.com",
		status: "inactive",
		role: "User",
		createdAt: new Date("2024-12-05"),
	},
];

const basicColumns: ColumnDef<User>[] = [
	{
		accessorKey: "name",
		header: "Name",
	},
	{
		accessorKey: "email",
		header: "Email",
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const status = row.getValue("status") as string;
			return (
				<Badge
					status={
						status === "active"
							? "success"
							: status === "inactive"
								? "error"
								: "warning"
					}
				>
					{status}
				</Badge>
			);
		},
	},
	{
		accessorKey: "role",
		header: "Role",
	},
];

const sortableColumns: ColumnDef<User>[] = [
	{
		accessorKey: "name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Name" />
		),
	},
	{
		accessorKey: "email",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Email" />
		),
	},
	{
		accessorKey: "status",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Status" />
		),
		cell: ({ row }) => {
			const status = row.getValue("status") as string;
			return (
				<Badge
					status={
						status === "active"
							? "success"
							: status === "inactive"
								? "error"
								: "warning"
					}
				>
					{status}
				</Badge>
			);
		},
	},
	{
		accessorKey: "role",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Role" />
		),
	},
	{
		accessorKey: "createdAt",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Created" />
		),
		cell: ({ row }) => {
			const date = row.getValue("createdAt") as Date;
			return date.toLocaleDateString();
		},
	},
];

const selectableColumns: ColumnDef<User>[] = [
	{
		id: "select",
		header: ({ table }) => <DataTableSelectAll table={table} />,
		cell: ({ row }) => <DataTableSelectRow row={row} />,
		enableSorting: false,
		enableHiding: false,
	},
	...sortableColumns,
	{
		id: "actions",
		cell: ({ row }) => (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon">
						<MoreHorizontalIcon className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem
						onClick={() => console.log("Edit", row.original)}
					>
						Edit
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => console.log("Delete", row.original)}
						className="text-destructive"
					>
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		),
	},
];

function BasicExample() {
	const { table } = useDataTable({
		data: sampleData.slice(0, 5),
		columns: basicColumns,
		enablePagination: false,
	});

	return <DataTable table={table} columns={basicColumns.length} />;
}

function SortableExample() {
	const { table } = useDataTable({
		data: sampleData,
		columns: sortableColumns,
		pageSize: 5,
	});

	return (
		<div className="space-y-4">
			<DataTable table={table} columns={sortableColumns.length} />
			<DataTablePagination table={table} />
		</div>
	);
}

function PaginatedExample() {
	const { table } = useDataTable({
		data: sampleData,
		columns: basicColumns,
		pageSize: 5,
	});

	return (
		<div className="space-y-4">
			<DataTable table={table} columns={basicColumns.length} />
			<DataTablePagination table={table} />
		</div>
	);
}

function SelectableExample() {
	const { table, rowSelection } = useDataTable({
		data: sampleData,
		columns: selectableColumns,
		pageSize: 5,
		enableRowSelection: true,
		getRowId: (row) => row.id,
	});

	return (
		<div className="space-y-4">
			<DataTable table={table} columns={selectableColumns.length} />
			<DataTablePagination table={table} showSelectedCount />
			<div className="text-sm text-muted-foreground">
				Selected IDs: {Object.keys(rowSelection).join(", ") || "None"}
			</div>
		</div>
	);
}

function ColumnVisibilityExample() {
	const { table } = useDataTable({
		data: sampleData,
		columns: sortableColumns,
		pageSize: 5,
	});

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<DataTableViewOptions table={table} />
			</div>
			<DataTable table={table} columns={sortableColumns.length} />
			<DataTablePagination table={table} />
		</div>
	);
}

function FullFeaturedExample() {
	const { table } = useDataTable({
		data: sampleData,
		columns: selectableColumns,
		pageSize: 5,
		enableRowSelection: true,
		getRowId: (row) => row.id,
	});

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<DataTableViewOptions table={table} />
			</div>
			<DataTable
				table={table}
				columns={selectableColumns.length}
				onRowClick={(row) => console.log("Row clicked:", row)}
			/>
			<DataTablePagination table={table} showSelectedCount />
		</div>
	);
}

function LoadingExample() {
	const { table } = useDataTable({
		data: [],
		columns: basicColumns,
	});

	return (
		<DataTable
			table={table}
			columns={basicColumns.length}
			isLoading={true}
			loadingMessage={
				<div className="flex items-center gap-2">
					<div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
					Loading users...
				</div>
			}
		/>
	);
}

function EmptyExample() {
	const { table } = useDataTable({
		data: [],
		columns: basicColumns,
	});

	return (
		<DataTable
			table={table}
			columns={basicColumns.length}
			emptyMessage={
				<div className="flex flex-col items-center py-8">
					<p className="text-lg font-medium">No users found</p>
					<p className="text-sm text-muted-foreground">
						Get started by adding a new user.
					</p>
					<Button className="mt-4">Add User</Button>
				</div>
			}
		/>
	);
}

const meta: Meta = {
	title: "UI/DataTable",
	parameters: { layout: "padded" },
	tags: ["autodocs"],
};

export default meta;

export const Basic = {
	render: () => <BasicExample />,
};

export const WithSorting = {
	render: () => <SortableExample />,
};

export const WithPagination = {
	render: () => <PaginatedExample />,
};

export const WithRowSelection = {
	render: () => <SelectableExample />,
};

export const WithColumnVisibility = {
	render: () => <ColumnVisibilityExample />,
};

export const FullFeatured = {
	render: () => <FullFeaturedExample />,
};

export const Loading = {
	render: () => <LoadingExample />,
};

export const Empty = {
	render: () => <EmptyExample />,
};
