import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRoles } from '@/hooks/useRoles';
import { roleService, Permission, GlobalRole, OrganizationalRoleDef } from '@/services/role.service';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ShieldCheck, ShieldAlert, Plus, RotateCw } from 'lucide-react';
import { toast } from 'sonner';

export default function RoleManagementPage() {
  const [activeTab, setActiveTab] = useState('global');
  const { globalRoles, orgRoleDefs, permissions, loading, error, refresh, updateGlobalRolePermissions, updateOrgRolePermissions } = useRoles();
  
  const [selectedRoleType, setSelectedRoleType] = useState<'global' | 'org'>('global');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [currentRolePermissions, setCurrentRolePermissions] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Initialize selectedRoleId when roles are loaded
  useEffect(() => {
    if (globalRoles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(globalRoles[0].id);
      setSelectedRoleType('global');
    }
  }, [globalRoles]);

  // Fetch permissions for the selected role
  useEffect(() => {
    const fetchRolePermissions = async () => {
      if (!selectedRoleId) return;
      
      try {
        let rolePerms: Permission[] = [];
        if (selectedRoleType === 'global') {
          rolePerms = await roleService.getGlobalRolePermissions(selectedRoleId);
        } else {
          rolePerms = await roleService.getOrganizationalRolePermissions(selectedRoleId);
        }
        setCurrentRolePermissions(rolePerms.map(p => p.id));
      } catch (err) {
        toast.error("Failed to load permissions for the selected role");
      }
    };

    fetchRolePermissions();
  }, [selectedRoleId, selectedRoleType]);

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    if (permissions && Array.isArray(permissions)) {
      permissions.forEach(p => {
        if (!groups[p.resource]) {
          groups[p.resource] = [];
        }
        groups[p.resource].push(p);
      });
    }
    return groups;
  }, [permissions]);

  const handlePermissionToggle = (permissionId: string) => {
    setCurrentRolePermissions(prev => 
      prev.includes(permissionId) 
        ? prev.filter(id => id !== permissionId) 
        : [...prev, permissionId]
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;
    
    setIsUpdating(true);
    let success = false;
    
    if (selectedRoleType === 'global') {
      success = await updateGlobalRolePermissions(selectedRoleId, currentRolePermissions);
    } else {
      success = await updateOrgRolePermissions(selectedRoleId, currentRolePermissions);
    }
    
    setIsUpdating(false);
    if (success) {
      toast.success("Permissions updated successfully");
    } else {
      toast.error("Failed to update permissions");
    }
  };

  if (loading && globalRoles.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-slate-500 font-medium">Loading security configuration...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 max-w-md mx-auto">
          <ShieldAlert className="h-10 w-10 mx-auto mb-2 opacity-80" />
          <p className="font-semibold">Security configuration unavailable</p>
          <p className="text-sm mt-1 opacity-90">{error}</p>
          <Button onClick={refresh} className="mt-4" variant="outline">Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800 flex items-center">
            <ShieldCheck className="mr-3 h-8 w-8 text-primary" />
            Role Management
          </h2>
          <p className="text-slate-500 mt-1">Configure granular permissions, dynamic roles, and access control.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={refresh} className="rounded-xl h-10">
            <RotateCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button className="bg-primary text-white rounded-xl shadow-sm hover:bg-primary/90 h-10">
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        </div>
      </div>

      <Tabs defaultValue="global" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-100/50 p-1 border border-slate-200/60 rounded-xl">
          <TabsTrigger value="global" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">Global Roles</TabsTrigger>
          <TabsTrigger value="organizational" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">Organizational Roles</TabsTrigger>
          <TabsTrigger value="permissions" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">Permissions Matrix</TabsTrigger>
        </TabsList>
        
        <TabsContent value="global" className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
          <Card className="border-slate-200/60 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 pb-4">
              <CardTitle className="text-lg font-semibold text-slate-800">Global System Roles</CardTitle>
              <CardDescription>Roles that apply universally across the entire platform.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-[200px]">Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Assigned Users</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {globalRoles.map((role: GlobalRole) => (
                    <TableRow key={role.id} className="group hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-rounded text-[18px]">shield_person</span>
                          </div>
                          {role.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm max-w-xs truncate">{role.description || 'No description provided'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium">
                          {role._count?.users?.toLocaleString() || 0} Users
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {role.isSystem ? (
                          <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100">System</Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-600 border-slate-200">Custom</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setSelectedRoleType('global');
                            setSelectedRoleId(role.id);
                            setActiveTab('permissions');
                          }}
                          className="h-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                        >
                          Permissions
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 text-slate-500 ml-2">
                          <span className="material-symbols-rounded text-[18px]">edit</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organizational" className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
          <Card className="border-slate-200/60 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 pb-4">
              <CardTitle className="text-lg font-semibold text-slate-800">Organizational Context Roles</CardTitle>
              <CardDescription>Roles scoped to specific contexts like Clubs, Departments, or Courses.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-[250px]">Role Definition</TableHead>
                    <TableHead>Context Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgRoleDefs.map((role: OrganizationalRoleDef) => (
                    <TableRow key={role.id} className="group hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-slate-700">{role.name}</TableCell>
                      <TableCell>
                         <Badge variant="outline" className="uppercase text-[10px] tracking-wider text-primary border-primary/20 bg-primary/5">
                           {role.organizationType}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">{role.description}</TableCell>
                      <TableCell>
                        {role.isSystem ? (
                          <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100">System</Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-600 border-slate-200">Custom</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                           variant="ghost" 
                           size="sm" 
                           onClick={() => {
                             setSelectedRoleType('org');
                             setSelectedRoleId(role.id);
                             setActiveTab('permissions');
                           }}
                           className="h-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                         >
                           Permissions
                         </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 text-slate-500 ml-2">
                          <span className="material-symbols-rounded text-[18px]">edit</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
          <Card className="border-slate-200/60 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800">Permissions Matrix</CardTitle>
                <CardDescription>Map roles to specific resource actions across the system.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                   <button 
                     onClick={() => {
                       setSelectedRoleType('global');
                       if (globalRoles.length > 0) setSelectedRoleId(globalRoles[0].id);
                     }}
                     className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${selectedRoleType === 'global' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                     Global
                   </button>
                   <button 
                     onClick={() => {
                       setSelectedRoleType('org');
                       if (orgRoleDefs.length > 0) setSelectedRoleId(orgRoleDefs[0].id);
                     }}
                     className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${selectedRoleType === 'org' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                     Organizational
                   </button>
                </div>
                
                <select 
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="h-9 rounded-xl border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 px-3 pr-8 min-w-[180px] border shadow-sm"
                >
                  {selectedRoleType === 'global' 
                    ? globalRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)
                    : orgRoleDefs.map(r => <option key={r.id} value={r.id}>{r.name}</option>)
                  }
                </select>
                
                <Button 
                  onClick={handleSavePermissions} 
                  disabled={isUpdating}
                  className="rounded-xl shadow-md bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-95"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <span className="material-symbols-rounded text-[18px] mr-2">save</span>}
                  Save Changes
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="w-[200px]">Resource</TableHead>
                      <TableHead>Permissions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(groupedPermissions).map(([resource, perms]) => (
                      <TableRow key={resource} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-bold text-slate-700 py-6">
                           <div className="flex items-center">
                             <div className="w-1.5 h-6 bg-primary/20 rounded-full mr-3" />
                             {resource}
                           </div>
                        </TableCell>
                        <TableCell className="py-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {perms.map(perm => (
                              <div 
                                key={perm.id} 
                                className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                                  currentRolePermissions.includes(perm.id) 
                                    ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/10' 
                                    : 'bg-white border-slate-100 hover:border-slate-200'
                                }`}
                                onClick={() => handlePermissionToggle(perm.id)}
                              >
                                <Checkbox 
                                  id={perm.id} 
                                  checked={currentRolePermissions.includes(perm.id)}
                                  onCheckedChange={() => handlePermissionToggle(perm.id)}
                                  className="rounded-md"
                                />
                                <div className="space-y-0.5">
                                  <label 
                                    htmlFor={perm.id}
                                    className="text-sm font-semibold text-slate-700 cursor-pointer block leading-none"
                                  >
                                    {perm.action}
                                  </label>
                                  <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                                    {perm.description || `Can ${perm.action.toLowerCase()} ${resource.toLowerCase()}`}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
