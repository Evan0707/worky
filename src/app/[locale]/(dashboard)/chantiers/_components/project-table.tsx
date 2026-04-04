"use client";

import { useTranslations } from "next-intl";
import { DataTable } from "@/components/data-table/data-table";
import { getColumns, ProjectRow } from "./columns";

interface ProjectTableProps {
  data: ProjectRow[];
  locale: string;
  hidePagination?: boolean;
  hideFilter?: boolean;
  fullHeight?: boolean;
}

export function ProjectTable({ data, locale, hidePagination, hideFilter, fullHeight }: ProjectTableProps) {
  const tProjects = useTranslations("projects");
  const columns = getColumns(locale, tProjects);

  return (
    <DataTable 
      columns={columns} 
      data={data} 
      filterColumn="name" 
      filterPlaceholder={tProjects("placeholders.name")}
      hidePagination={hidePagination}
      hideFilter={hideFilter}
      fullHeight={fullHeight}
    />
  );
}
