import React, { useState, useEffect } from "react";
import { useApiClient } from "@/lib/api-client";
import { useAdminService } from "@/services/admin.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, UserPlus, MoreHorizontal, Mail, ShieldCheck, Download, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function UserDirectoryPage() {
  const api = useApiClient();
  const adminService = useAdminService(api);

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const filters: any = {
        q: search,
        page,
        limit: 10,
      };
      if (roleFilter !== "all") filters.globalRoleId = roleFilter;

      const response = await adminService.getUsers(filters);
      if (response.success) {
        const rawData = (response.data as any) || response;
        const userData = rawData.users || rawData.items || (Array.isArray(rawData) ? rawData : []);
        setUsers(userData);
        
        const pagination = response.pagination || (response as any).meta;
        if (pagination) {
          setTotalPages(pagination.totalPages || 1);
        }
      }
    } catch (error) {
      toast.error("Failed to fetch user directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, roleFilter, page]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-foreground font-heading uppercase italic">User Directory</h2>
          <p className="text-muted-foreground text-sm font-medium">Manage and audit all identities across the UniVerse ecosystem.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-2xl shadow-sm h-11 px-5 border-border bg-white">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Button className="rounded-2xl shadow-lg shadow-primary/20 h-11 px-6 bg-primary hover:bg-primary/90 text-white font-bold uppercase text-xs tracking-widest">
            <UserPlus className="h-4 w-4 mr-2" /> Provision User
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[32px]">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email or student ID..."
                className="pl-11 h-12 rounded-2xl bg-white border-slate-200 shadow-sm focus-visible:ring-primary/20 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px] h-12 rounded-2xl bg-white border-slate-200 shadow-sm font-medium">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 shadow-xl">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Administrators</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="h-10 w-10 animate-spin text-primary/30 mb-4" />
                <p className="text-muted-foreground font-bold tracking-widest uppercase text-[10px] animate-pulse">Syncing Directory...</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/30">
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="pl-8 h-14 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Identity Profile</TableHead>
                    <TableHead className="h-14 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Status</TableHead>
                    <TableHead className="h-14 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Access Role</TableHead>
                    <TableHead className="h-14 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Credential</TableHead>
                    <TableHead className="h-14 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Registration</TableHead>
                    <TableHead className="text-right pr-8 h-14 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Operations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                           <Users className="h-8 w-8 text-slate-200" />
                           <p className="text-slate-400 font-medium italic">No matches found in database.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
                        <TableCell className="pl-8 py-5">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-md rounded-2xl">
                              <AvatarImage src={user.avatar || user.imageUrl} />
                              <AvatarFallback className="bg-primary/10 text-primary font-black text-sm rounded-2xl">
                                {(user.name || user.username)?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 line-clamp-1">{user.name || user.username}</span>
                              <span className="text-xs text-slate-400 font-medium">{user.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none rounded-lg px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-400 border-none rounded-lg px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">{user.role || user.globalRole?.name}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.isVerified ? (
                              <div className="flex items-center gap-1 text-emerald-500">
                                <ShieldCheck className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-tighter">Verified</span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Unverified</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-slate-500 font-bold">
                            {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-sm">
                              <Mail className="h-4 w-4 text-slate-400" />
                            </Button>
                            <Link to={`/admin/identity/directory/${user.id}`}>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-sm">
                                <MoreHorizontal className="h-4 w-4 text-slate-400" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
              Database Sync: {users.length} Records Loaded
            </p>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 px-5 rounded-xl font-bold text-xs border-slate-200 bg-white"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-primary">{page}</span>
                <span className="text-[10px] text-slate-300 font-black">/</span>
                <span className="text-xs font-black text-slate-400">{totalPages}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 px-5 rounded-xl font-bold text-xs border-slate-200 bg-white"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
