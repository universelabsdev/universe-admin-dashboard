import { useState, useEffect, useCallback } from 'react';
import { roleService, GlobalRole, OrganizationalRoleDef, Permission } from '@/services/role.service';

export function useRoles() {
  const [globalRoles, setGlobalRoles] = useState<GlobalRole[]>([]);
  const [orgRoleDefs, setOrgRoleDefs] = useState<OrganizationalRoleDef[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [gr, ord, p] = await Promise.all([
        roleService.getGlobalRoles(),
        roleService.getOrganizationalRoleDefs(),
        roleService.getPermissions()
      ]);
      setGlobalRoles(Array.isArray(gr) ? gr : []);
      setOrgRoleDefs(Array.isArray(ord) ? ord : []);
      setPermissions(Array.isArray(p) ? p : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const updateGlobalRolePermissions = async (roleId: string, permissionIds: string[]) => {
    try {
      await roleService.updateGlobalRolePermissions(roleId, permissionIds);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update permissions');
      return false;
    }
  };

  const updateOrgRolePermissions = async (roleDefId: string, permissionIds: string[]) => {
    try {
      await roleService.updateOrganizationalRolePermissions(roleDefId, permissionIds);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update permissions');
      return false;
    }
  };

  const updateGlobalRole = async (roleId: string, data: Partial<GlobalRole>) => {
    try {
      await roleService.updateGlobalRole(roleId, data);
      await fetchAll();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
      return false;
    }
  };

  const updateOrgRole = async (roleDefId: string, data: Partial<OrganizationalRoleDef>) => {
    try {
      await roleService.updateOrganizationalRoleDef(roleDefId, data);
      await fetchAll();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
      return false;
    }
  };

  return {
    globalRoles,
    orgRoleDefs,
    permissions,
    loading,
    error,
    refresh: fetchAll,
    updateGlobalRolePermissions,
    updateOrgRolePermissions,
    updateGlobalRole,
    updateOrgRole
  };
}
