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
import { Search, Filter, UserPlus, MoreHorizontal, Mail, ShieldCheck, Download, Loader2 } from "lucide-react";
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
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading">User Directory</h2>
          <p className="text-muted-foreground mt-1 text-[15px]">Manage and audit all identities across the UniVerse ecosystem.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full shadow-sm h-10 px-5 border-border bg-card">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Button className="rounded-full shadow-none h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
            <UserPlus className="h-4 w-4 mr-2" /> Provision User
          </Button>
        </div>
      </div>

      <Card className="premium-card">
        <CardHeader className="border-b border-border/50 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email or student ID..."
                className="pl-10 h-11 rounded-full bg-muted/50 border-none focus-visible:ring-primary/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[160px] h-11 rounded-full bg-muted/50 border-none">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border">
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
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium">Synchronizing records...</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="pl-6 h-12 text-[12px] uppercase tracking-wider font-bold text-muted-foreground">User</TableHead>
                    <TableHead className="h-12 text-[12px] uppercase tracking-wider font-bold text-muted-foreground">Status</TableHead>
                    <TableHead className="h-12 text-[12px] uppercase tracking-wider font-bold text-muted-foreground">Role</TableHead>
                    <TableHead className="h-12 text-[12px] uppercase tracking-wider font-bold text-muted-foreground">Identity</TableHead>
                    <TableHead className="h-12 text-[12px] uppercase tracking-wider font-bold text-muted-foreground">Joined</TableHead>
                    <TableHead className="text-right pr-6 h-12 text-[12px] uppercase tracking-wider font-bold text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No users found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id} className="border-border/50 hover:bg-muted/20 transition-colors">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-border shadow-sm">
                              <AvatarImage src={user.avatar || user.imageUrl} />
                              <AvatarFallback className="bg-primary/5 text-primary font-bold">
                                {(user.name || user.username)?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground line-clamp-1">{user.name || user.username}</span>
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none rounded-full px-3 py-0.5 text-[11px] font-bold">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-muted text-muted-foreground border-none rounded-full px-3 py-0.5 text-[11px] font-bold">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium text-foreground uppercase tracking-tight">{user.role || user.globalRole?.name}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.isVerified ? (
                              <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                            )}
                            <span className="text-xs text-muted-foreground font-mono">{user.studentId || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground font-medium">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Link to={`/admin/identity/directory/${user.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted">
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
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

          <div className="p-4 border-t border-border/50 flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">
              Showing {users.length} users
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 px-4 rounded-full font-bold text-xs"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1 px-3 py-1 bg-muted rounded-full">
                <span className="text-xs font-bold text-primary">{page}</span>
                <span className="text-[10px] text-muted-foreground font-bold">/</span>
                <span className="text-[10px] text-muted-foreground font-bold">{totalPages}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 px-4 rounded-full font-bold text-xs"
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
