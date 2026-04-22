import api from '@/lib/api';

export interface GlobalRole {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  _count?: {
    users: number;
  };
}

export interface OrganizationalRoleDef {
  id: string;
  name: string;
  organizationType: string;
  description: string;
  isSystem: boolean;
}

export interface Permission {
  id: string;
  action: string;
  resource: string;
  description: string;
}

class RoleService {
  async getGlobalRoles() {
    const response = await api.get('/admin/roles/global');
    return response.data.data as GlobalRole[];
  }

  async getOrganizationalRoleDefs() {
    const response = await api.get('/admin/roles/organizational');
    return response.data.data as OrganizationalRoleDef[];
  }

  async getPermissions() {
    const response = await api.get('/admin/permissions');
    return response.data.data as Permission[];
  }

  async getGlobalRolePermissions(roleId: string) {
    const response = await api.get(`/admin/roles/global/${roleId}/permissions`);
    return response.data.data as Permission[];
  }

  async getOrganizationalRolePermissions(roleDefId: string) {
    const response = await api.get(`/admin/roles/organizational/${roleDefId}/permissions`);
    return response.data.data as Permission[];
  }

  async updateGlobalRolePermissions(roleId: string, permissionIds: string[]) {
    const response = await api.patch(`/admin/roles/global/${roleId}/permissions`, { permissionIds });
    return response.data;
  }

  async updateOrganizationalRolePermissions(roleDefId: string, permissionIds: string[]) {
    const response = await api.patch(`/admin/roles/organizational/${roleDefId}/permissions`, { permissionIds });
    return response.data;
  }

  async createGlobalRole(data: Partial<GlobalRole>) {
    const response = await api.post('/admin/roles/global', data);
    return response.data.data as GlobalRole;
  }

  async createOrganizationalRoleDef(data: Partial<OrganizationalRoleDef>) {
    const response = await api.post('/admin/roles/organizational', data);
    return response.data.data as OrganizationalRoleDef;
  }
}

export const roleService = new RoleService();
