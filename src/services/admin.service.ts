import { ApiResponse } from '../lib/api-client';

export interface Building {
  id: string;
  name: string;
  code: string;
  floors: number;
  branch: string;
}

export const useAdminService = (api: any) => {
  return {
    /**
     * Fetch dashboard summary stats
     */
    getDashboardStats: async (): Promise<ApiResponse<any>> => {
      return await api.get('/admin/dashboard/stats');
    },

    /**
     * Fetch dashboard growth data
     */
    getDashboardGrowth: async (): Promise<ApiResponse<any[]>> => {
      return await api.get('/admin/dashboard/growth');
    },

    /**
     * Fetch dashboard role distribution
     */
    getDashboardRoles: async (): Promise<ApiResponse<any[]>> => {
      return await api.get('/admin/dashboard/roles');
    },

    /**
     * Fetch recent activity
     */
    getDashboardActivity: async (): Promise<ApiResponse<any[]>> => {
      return await api.get('/admin/dashboard/activity');
    },

    /**
     * Fetch all buildings
     */
    getBuildings: async (): Promise<ApiResponse<Building[]>> => {
      return await api.get('/admin/buildings');
    },

    /**
     * Create a new building
     */
    createBuilding: async (data: Omit<Building, 'id'>): Promise<ApiResponse<Building>> => {
      return await api.post('/admin/buildings', data);
    },

    /**
     * Update an existing building
     */
    updateBuilding: async (id: string, data: Partial<Building>): Promise<ApiResponse<Building>> => {
      return await api.patch(`/admin/buildings/${id}`, data);
    },

    /**
     * Delete a building
     */
    deleteBuilding: async (id: string): Promise<ApiResponse<void>> => {
      return await api.delete(`/admin/buildings/${id}`);
    },

    /**
     * Fetch elections (admin/manager view)
     */
    getElections: async (params: {
      status?: 'active' | 'upcoming' | 'past' | 'all';
      category?: string;
      q?: string;
      page?: number;
      limit?: number;
    }): Promise<ApiResponse<{ elections: any[]; total: number }>> => {
      return await api.get('/elections', { params });
    },

    /**
     * Fetch election results
     */
    getElectionResults: async (id: string): Promise<ApiResponse<any>> => {
      return await api.get(`/elections/${id}/results`);
    },

    /**
     * Fetch election analytics summary
     */
    getElectionAnalytics: async (): Promise<ApiResponse<any>> => {
      return await api.get('/elections/analytics');
    },

    /**
     * Create a new election
     */
    createElection: async (data: any): Promise<ApiResponse<any>> => {
      return await api.post('/elections', data);
    },

    /**
     * Update an existing election's status
     */
    updateElectionStatus: async (id: string, status: string): Promise<ApiResponse<any>> => {
      return await api.patch(`/elections/${id}/status`, { status });
    },

    /**
     * Add a candidate to an existing election
     */
    addCandidate: async (
      electionId: string,
      data: { userId?: string; candidateType: string; optionText?: string; manifesto?: string; imageUrl?: string; displayOrder?: number }
    ): Promise<ApiResponse<any>> => {
      return await api.post(`/elections/${electionId}/candidates`, data);
    },

    /**
     * Remove a candidate from an election
     */
    removeCandidate: async (electionId: string, candidateId: string): Promise<ApiResponse<void>> => {
      return await api.delete(`/elections/${electionId}/candidates/${candidateId}`);
    },

    /**
     * Fetch candidates for a specific election
     */
    getCandidates: async (electionId: string): Promise<ApiResponse<any[]>> => {
      return await api.get(`/elections/${electionId}/candidates`);
    },

    /**
     * Fetch all university branches
     */
    getBranches: async (): Promise<ApiResponse<any[]>> => {
      return await api.get('/directory/branches');
    },

    /**
     * Fetch metadata (enums) for forms
     */
    getMetadata: async (): Promise<ApiResponse<any>> => {
      return await api.get('/config/metadata');
    },

    /**
     * Fetch departments (optional branchId filter)
     */
    getDepartments: async (branchId?: string): Promise<ApiResponse<any[]>> => {
      return await api.get('/directory/departments', { params: { branchId } });
    },

    /**
     * Fetch a paginated list of users for the directory (admin only)
     */
    getUsers: async (params: { q?: string; page?: number; limit?: number; major?: string; clubId?: string; globalRoleId?: string; departmentId?: string; branchId?: string; isVerified?: boolean }): Promise<ApiResponse<any[]>> => {
      return await api.get('/admin/users', { params });
    },

    /**
     * Verify or unverify a user
     */
    verifyUser: async (userId: string, isVerified: boolean): Promise<ApiResponse<any>> => {
      return await api.patch(`/admin/users/${userId}/verify`, { isVerified });
    },

    /**
     * Fetch network analytics
     */
    getNetworkAnalytics: async (): Promise<ApiResponse<any>> => {
      return await api.get('/admin/network/analytics');
    },

    /**
     * Fetch moderation queue
     */
    getModerationQueue: async (params?: {
      page?: number;
      limit?: number;
      status?: string;
      contentType?: string;
      priority?: string;
    }): Promise<ApiResponse<{ items: any[]; total: number }>> => {
      return await api.get('/admin/moderation/queue', { params });
    },

    /**
     * Moderate content (approve/reject)
     */
    moderateContent: async (id: string, action: 'APPROVE' | 'REJECT', reason?: string): Promise<ApiResponse<void>> => {
      return await api.post(`/admin/moderation/${id}`, { action, reason });
    },

    /**
     * Fetch user reports
     */
    getReports: async (params?: {
      page?: number;
      limit?: number;
      status?: string;
      reason?: string;
      contentType?: string;
    }): Promise<ApiResponse<{ items: any[]; total: number }>> => {
      return await api.get('/admin/reports', { params });
    },

    /**
     * Resolve/Dismiss report
     */
    resolveReport: async (id: string, action: 'RESOLVE' | 'DISMISS', resolution: string, actionTaken?: string): Promise<ApiResponse<void>> => {
      return await api.post(`/admin/reports/${id}/resolve`, { action, resolution, actionTaken });
    },

    /**
     * Handle file uploads (Multipart/form-data)
     */
    uploadMedia: async (file: File): Promise<ApiResponse<{ url: string }>> => {
      const formData = new FormData();
      formData.append('file', file);

      return await api.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  };
};
