import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Input } from "./input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount?: number;
  onPaginationChange?: (pagination: {
    pageIndex: number;
    pageSize: number;
  }) => void;
  onSortingChange?: (sorting: SortingState) => void;
  onGlobalFilterChange?: (filter: string) => void;
  onRowSelectionChange?: (rowSelection: Record<string, boolean>) => void;
  globalFilter?: string;
  sorting?: SortingState;
  pagination?: { pageIndex: number; pageSize: number };
  rowSelection?: Record<string, boolean>;
  manualPagination?: boolean;
  manualSorting?: boolean;
  manualFiltering?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  onPaginationChange,
  onSortingChange,
  onGlobalFilterChange,
  onRowSelectionChange,
  globalFilter: controlledGlobalFilter,
  sorting: controlledSorting,
  pagination: controlledPagination,
  rowSelection: controlledRowSelection,
  manualPagination = false,
  manualSorting = false,
  manualFiltering = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      sorting: controlledSorting ?? sorting,
      columnFilters,
      columnVisibility,
      rowSelection: controlledRowSelection ?? rowSelection,
      globalFilter: controlledGlobalFilter ?? globalFilter,
      pagination: controlledPagination,
    },
    onSortingChange: (updater) => {
      if (onSortingChange) {
        onSortingChange(
          typeof updater === "function"
            ? updater(controlledSorting ?? sorting)
            : updater,
        );
      } else {
        setSorting(updater);
      }
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      if (onRowSelectionChange) {
        onRowSelectionChange(
          typeof updater === "function"
            ? updater(controlledRowSelection ?? rowSelection)
            : updater,
        );
      } else {
        setRowSelection(updater);
      }
    },
    onGlobalFilterChange: (updater) => {
      if (onGlobalFilterChange) {
        onGlobalFilterChange(
          typeof updater === "function"
            ? updater(controlledGlobalFilter ?? globalFilter)
            : updater,
        );
      } else {
        setGlobalFilter(updater);
      }
    },
    onPaginationChange: (updater) => {
      if (onPaginationChange) {
        onPaginationChange(
          typeof updater === "function"
            ? updater(controlledPagination ?? { pageIndex: 0, pageSize: 10 })
            : updater,
        );
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: manualFiltering ? undefined : getFilteredRowModel(),
    getPaginationRowModel: manualPagination
      ? undefined
      : getPaginationRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    manualPagination,
    manualSorting,
    manualFiltering,
  });

  // Debounce global filter
  const [inputValue, setInputValue] = React.useState(
    controlledGlobalFilter ?? globalFilter,
  );

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (onGlobalFilterChange) {
        onGlobalFilterChange(inputValue);
      } else {
        setGlobalFilter(inputValue);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [inputValue, onGlobalFilterChange]);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative w-full max-w-sm">
            <span className="material-symbols-rounded absolute left-3 top-2.5 text-[20px] text-slate-500">search</span>
            <Input
              placeholder="Search all columns..."
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <span className="material-symbols-rounded ml-2 text-[20px]">expand_more</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-slate-500">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <select
              className="h-8 w-[70px] rounded-md border border-slate-200 bg-transparent px-2 py-1 text-sm"
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <span className="material-symbols-rounded text-[20px]">chevron_left</span>
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <span className="material-symbols-rounded text-[20px]">chevron_right</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
