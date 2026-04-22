import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { toast } from "sonner";

import api from "../../../lib/api";
import { DataTable } from "../../../components/ui/data-table";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Checkbox } from "../../../components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Badge } from "../../../components/ui/badge";

// Types
interface Building {
  id: string;
  name: string;
  code: string;
  floors: number;
  branch: string;
  branchId: string | null;
}

interface Branch {
  id: string;
  name: string;
}

// Validation Schema
const buildingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters"),
  floors: z.coerce.number().min(1, "Must have at least 1 floor"),
  branchId: z.string().min(1, "Branch is required"),
});

type BuildingFormValues = z.infer<typeof buildingSchema>;

export default function BuildingsPage() {
  const queryClient = useQueryClient();

  // Table State
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(
    null,
  );

  // Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BuildingFormValues>({
    resolver: zodResolver(buildingSchema) as any,
  });

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ["buildings", pagination, sorting, globalFilter],
    queryFn: async () => {
      const response = await api.get("/admin/buildings", {
        params: {
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
          search: globalFilter,
          sort: sorting.length > 0 ? sorting[0].id : "name",
          order: sorting.length > 0 && sorting[0].desc ? "desc" : "asc",
        },
      });
      return response.data;
    },
  });

  const { data: branchesData } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const response = await api.get("/directory/branches");
      return (response.data?.data ?? response.data ?? []) as Branch[];
    },
    staleTime: 5 * 60 * 1000,
  });
  const branches: Branch[] = branchesData ?? [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newBuilding: BuildingFormValues) =>
      api.post("/admin/buildings", newBuilding),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      toast.success("Building created successfully");
      setIsCreateOpen(false);
      reset();
    },
    onError: () => toast.error("Failed to create building"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BuildingFormValues }) =>
      api.patch(`/admin/buildings/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      toast.success("Building updated successfully");
      setIsEditOpen(false);
      setSelectedBuilding(null);
    },
    onError: () => toast.error("Failed to update building"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/buildings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      toast.success("Building deleted successfully");
      setIsDeleteOpen(false);
      setSelectedBuilding(null);
    },
    onError: () => toast.error("Failed to delete building"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => api.delete("/admin/buildings", { data: { ids } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      toast.success("Selected buildings deleted successfully");
      setRowSelection({});
    },
    onError: () => toast.error("Failed to delete buildings"),
  });

  // Handlers
  const onSubmitCreate = (data: BuildingFormValues) =>
    createMutation.mutate(data);
  const onSubmitEdit = (data: BuildingFormValues) => {
    if (selectedBuilding) {
      updateMutation.mutate({ id: selectedBuilding.id, data });
    }
  };

  const handleEditClick = (building: Building) => {
    setSelectedBuilding(building);
    setValue("name", building.name);
    setValue("code", building.code);
    setValue("floors", building.floors);
    setValue("branchId", building.branchId ?? "");
    setIsEditOpen(true);
  };

  const handleDeleteClick = (building: Building) => {
    setSelectedBuilding(building);
    setIsDeleteOpen(true);
  };

  const handleBulkDelete = () => {
    const selectedIds = Object.keys(rowSelection).filter(
      (key) => rowSelection[key],
    );
    if (selectedIds.length > 0) {
      if (
        window.confirm(
          `Are you sure you want to delete ${selectedIds.length} buildings?`,
        )
      ) {
        bulkDeleteMutation.mutate(selectedIds);
      }
    }
  };

  // Columns definition
  const columns: ColumnDef<Building>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
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
      header: "Building Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
            <span className="material-symbols-rounded h-5 w-5 text-primary">domain</span>
          </div>
          <div>
            <div className="font-semibold text-slate-900">{row.getValue("name")}</div>
            <div className="text-xs text-slate-500 font-medium flex items-center mt-0.5">
              <span className="material-symbols-rounded h-3 w-3 mr-1 text-[14px]">location_on</span> {row.original.branch}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-xs bg-slate-50 text-slate-600 border-slate-200">
          {row.getValue("code")}
        </Badge>
      ),
    },
    {
      accessorKey: "floors",
      header: "Floors",
      cell: ({ row }) => (
        <div className="flex items-center text-slate-600 font-medium">
          <span className="material-symbols-rounded h-4 w-4 mr-2 text-slate-400 text-[16px]">layers</span>
          {row.getValue("floors")}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const building = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 data-[state=open]:bg-slate-100 rounded-full">
                  <span className="sr-only">Open menu</span>
                  <span className="material-symbols-rounded h-4 w-4 text-slate-500 text-[20px]">more_horiz</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-2xl shadow-lg border-slate-100 p-2">
                <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 py-1.5">Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(building.id)}
                  className="cursor-pointer font-medium rounded-xl py-2 focus:bg-primary/10 focus:text-primary"
                >
                  Copy ID
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-100 my-1" />
                <DropdownMenuItem onClick={() => handleEditClick(building)} className="cursor-pointer font-medium rounded-xl py-2 focus:bg-primary/10 focus:text-primary">
                  <span className="material-symbols-rounded mr-2 h-4 w-4 text-[18px]">edit</span> Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(building)}
                  className="text-red-600 cursor-pointer font-medium focus:text-red-700 focus:bg-red-50 rounded-xl py-2"
                >
                  <span className="material-symbols-rounded mr-2 h-4 w-4 text-[18px]">delete</span> Delete Building
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-heading">
            Buildings
          </h2>
          <p className="text-slate-500 mt-1">
            Manage university buildings, facilities, and physical infrastructure.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white rounded-full shadow-sm border-slate-200 hidden sm:flex hover:bg-slate-50">
            <span className="material-symbols-rounded mr-2 text-[18px] text-slate-500">download</span> Export
          </Button>
          <Button
            onClick={() => {
              reset();
              setIsCreateOpen(true);
            }}
            className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 rounded-full font-semibold"
          >
            <span className="material-symbols-rounded mr-2 text-[18px]">add</span> Add Building
          </Button>
        </div>
      </div>

      <div className="premium-card rounded-3xl border-none shadow-sm bg-white overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">search</span>
            <Input
              placeholder="Search buildings by name or code..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-12 bg-white border-slate-200 rounded-full shadow-sm focus-visible:ring-primary w-full h-11"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {Object.keys(rowSelection).length > 0 && (
              <Button variant="destructive" onClick={handleBulkDelete} className="rounded-full shadow-sm font-semibold">
                <span className="material-symbols-rounded mr-2 text-[18px]">delete</span>
                Delete ({Object.keys(rowSelection).length})
              </Button>
            )}
            <Button variant="outline" className="bg-white rounded-full shadow-sm border-slate-200 w-full sm:w-auto hover:bg-slate-50">
              <span className="material-symbols-rounded mr-2 text-[18px] text-slate-500">filter_list</span> Filters
            </Button>
          </div>
        </div>

        <div className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-slate-500 font-medium">Loading buildings...</p>
              </div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={data?.data || []}
              pageCount={Math.ceil((data?.pagination?.total || 0) / pagination.pageSize)}
              pagination={pagination}
              sorting={sorting}
              globalFilter={globalFilter}
              rowSelection={rowSelection}
              onPaginationChange={setPagination}
              onSortingChange={setSorting}
              onGlobalFilterChange={setGlobalFilter}
              onRowSelectionChange={setRowSelection}
              manualPagination
              manualSorting
              manualFiltering
            />
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
          <div className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center font-heading">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3">
                <span className="material-symbols-rounded text-[20px]">add</span>
              </div>
              Add New Building
            </DialogTitle>
            <DialogDescription className="mt-2 text-slate-500">
              Enter the details of the new building here. Click save when you're done.
            </DialogDescription>
          </div>
          <form onSubmit={handleSubmit(onSubmitCreate)} className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-slate-700">Building Name</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="e.g. Engineering Block"
                className="rounded-xl border-slate-200 focus-visible:ring-primary shadow-sm"
              />
              {errors.name && (
                <p className="text-sm text-red-500 font-medium">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-semibold text-slate-700">Building Code</Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="e.g. ENG-01"
                className="rounded-xl border-slate-200 focus-visible:ring-primary shadow-sm font-mono"
              />
              {errors.code && (
                <p className="text-sm text-red-500 font-medium">{errors.code.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="floors" className="text-sm font-semibold text-slate-700">Floors</Label>
                <Input 
                  id="floors" 
                  type="number" 
                  {...register("floors")} 
                  className="rounded-xl border-slate-200 focus-visible:ring-primary shadow-sm"
                />
                {errors.floors && (
                  <p className="text-sm text-red-500 font-medium">
                    {errors.floors.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="branchId" className="text-sm font-semibold text-slate-700">Branch</Label>
                <select
                  id="branchId"
                  {...register("branchId")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {errors.branchId && (
                  <p className="text-sm text-red-500 font-medium">
                    {errors.branchId.message}
                  </p>
                )}
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-full font-semibold border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="rounded-full font-semibold bg-primary hover:bg-primary/90 shadow-sm text-white">
                {createMutation.isPending ? "Saving..." : "Save Building"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
          <div className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center font-heading">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3">
                <span className="material-symbols-rounded text-[20px]">edit</span>
              </div>
              Edit Building
            </DialogTitle>
            <DialogDescription className="mt-2 text-slate-500">
              Make changes to the building details here.
            </DialogDescription>
          </div>
          <form onSubmit={handleSubmit(onSubmitEdit)} className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-semibold text-slate-700">Building Name</Label>
              <Input id="edit-name" {...register("name")} className="rounded-xl border-slate-200 focus-visible:ring-primary shadow-sm" />
              {errors.name && (
                <p className="text-sm text-red-500 font-medium">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-code" className="text-sm font-semibold text-slate-700">Building Code</Label>
              <Input id="edit-code" {...register("code")} className="rounded-xl border-slate-200 focus-visible:ring-primary shadow-sm font-mono" />
              {errors.code && (
                <p className="text-sm text-red-500 font-medium">{errors.code.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="edit-floors" className="text-sm font-semibold text-slate-700">Floors</Label>
                <Input id="edit-floors" type="number" {...register("floors")} className="rounded-xl border-slate-200 focus-visible:ring-primary shadow-sm" />
                {errors.floors && (
                  <p className="text-sm text-red-500 font-medium">
                    {errors.floors.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-branchId" className="text-sm font-semibold text-slate-700">Branch</Label>
                <select
                  id="edit-branchId"
                  {...register("branchId")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {errors.branchId && (
                  <p className="text-sm text-red-500 font-medium">
                    {errors.branchId.message}
                  </p>
                )}
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="rounded-full font-semibold border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} className="rounded-full font-semibold bg-primary hover:bg-primary/90 shadow-sm text-white">
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
          <div className="px-6 py-6 border-b border-slate-100 bg-red-50/50">
            <DialogTitle className="text-xl font-bold text-red-700 flex items-center font-heading">
              <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-3">
                <span className="material-symbols-rounded text-[20px]">delete</span>
              </div>
              Are you absolutely sure?
            </DialogTitle>
          </div>
          <div className="p-6">
            <DialogDescription className="text-slate-600 text-base leading-relaxed">
              This action cannot be undone. This will permanently delete the
              building
              <span className="font-bold text-slate-900 mx-1">
                {selectedBuilding?.name}
              </span>
              and remove its data from our servers.
            </DialogDescription>
            <div className="pt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-full font-semibold border-slate-200 hover:bg-slate-50">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  selectedBuilding && deleteMutation.mutate(selectedBuilding.id)
                }
                disabled={deleteMutation.isPending}
                className="rounded-full font-semibold shadow-sm"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Building"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
