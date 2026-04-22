import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdminService, Building } from '../services/admin.service';
import { useApiClient } from '../lib/api-client';

export const useBuildings = (page: number = 1, limit: number = 10) => {
  const queryClient = useQueryClient();
  const api = useApiClient();
  const adminService = useAdminService(api);

  // Fetch Buildings
  const query = useQuery({
    queryKey: ['buildings', page, limit],
    queryFn: () => adminService.getBuildings(),
  });

  // Create Building
  const createMutation = useMutation({
    mutationFn: (data: Omit<Building, 'id'>) => adminService.createBuilding(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
    },
  });

  // Update Building
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Building> }) => 
      adminService.updateBuilding(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
    },
  });

  // Delete Building
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteBuilding(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
    },
  });

  return {
    // Query state
    buildings: query.data?.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    // Mutations
    createBuilding: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    
    updateBuilding: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    
    deleteBuilding: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};
