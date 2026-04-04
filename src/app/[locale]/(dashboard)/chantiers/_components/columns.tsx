"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { formatDate } from "@/lib/i18n-helpers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, SquareArrowOutUpRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Same as the Project type from Prisma but simplified for client use
export type ProjectRow = {
  id: string;
  name: string;
  clientName: string;
  address: string;
  status: string;
  createdAt: Date;
  _count: { photos: number };
};

export function getColumns(locale: string, translations: any): ColumnDef<ProjectRow>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={translations("fields.name")} />
      ),
      cell: ({ row }) => {
        return (
          <Link
            href={`/${locale}/chantiers/${row.original.id}`}
            className="font-medium hover:underline flex items-center gap-1.5"
          >
            {row.getValue("name")}
            <SquareArrowOutUpRight className="h-3 w-3 text-muted-foreground opacity-50" />
          </Link>
        );
      },
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
            variant={status === "ACTIVE" ? "default" : "secondary"}
            className={status === "ACTIVE" ? "animate-pulse" : ""}
          >
            {translations(`status.${status}`)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "clientName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={translations("fields.clientName")} />
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        return (
          <span className="text-muted-foreground tabular-nums">
            {formatDate(row.getValue("createdAt"), locale)}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const project = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{translations("actions.label")}</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/${locale}/chantiers/${project.id}`}>
                  {translations("actions.view")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(project.id)}>
                {translations("actions.copyId")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                {translations("actions.deactivate")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
