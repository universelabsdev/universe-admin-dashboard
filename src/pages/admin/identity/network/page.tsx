import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAdminService } from '@/services/admin.service';
import { useApiClient } from '@/lib/api-client';
import { useUser } from "@/hooks/useUser";
import { 
  Network, Users, Loader2, Search, Filter, LayoutGrid, List, 
  UserPlus, UserMinus, SearchX, Activity, BarChart3, TrendingUp, 
  MapPin, GraduationCap, Building2, Calendar, Mail, Shield, 
  MessageSquare, MoreHorizontal, Download, Share2, Sparkles,
  CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, AreaChart, Area, PieChart, Pie
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

export default function NetworkManagementPage() {
  const api = useApiClient();
  const adminService = useAdminService(api);
  const { user: currentUser } = useUser();

  // State
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  
  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Metadata
  const [departments, setDepartments] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  // Selection & Modal
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchMetadata = async () => {
    try {
      const [deptsRes, branchesRes] = await Promise.all([
        adminService.getDepartments(),
        adminService.getBranches()
      ]);
      if (deptsRes.success) setDepartments(deptsRes.data);
      if (branchesRes.success) setBranches(branchesRes.data);
    } catch (err) {
      console.error("Failed to fetch metadata", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await adminService.getNetworkAnalytics();
      if (res.success) setAnalytics(res.data);
    } catch (err) {
      console.error("Failed to load network analytics", err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      if (activeTab === "following" && currentUser) {
        const res = await api.get(`/users/${currentUser.id}/following`);
        setUsers((res as any).data || (res as any).items || []);
        setTotalPages(1);
        return;
      } else if (activeTab === "followers" && currentUser) {
        const res = await api.get(`/users/${currentUser.id}/followers`);
        setUsers((res as any).data || (res as any).items || []);
        setTotalPages(1);
        return;
      }

      const filters: any = { 
        page, 
        limit: 12, 
        q: search,
        departmentId: deptFilter !== 'all' ? deptFilter : undefined,
        branchId: branchFilter !== 'all' ? branchFilter : undefined
      };
      if (roleFilter !== 'all') filters.role = roleFilter;

      const res = await adminService.getUsers(filters);
      if (res.success) {
        const rawData = (res.data as any) || res;
        const userData = rawData.users || rawData.items || (Array.isArray(rawData) ? rawData : []);
        setUsers(userData);
        
        const pagination = res.pagination || (res as any).meta || (res as any).pagination;
        if (pagination) {
          setTotalPages(pagination.totalPages || Math.ceil((pagination.total || 0) / 12) || 1);
        }
      }
    } catch (err) {
      toast.error("Failed to fetch directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    // Immediately set loading and clear results to prevent flickering/stale data
    if (activeTab !== "overview") {
      setLoading(true);
      setUsers([]);
    }
    
    const delay = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(delay);
  }, [search, roleFilter, deptFilter, branchFilter, page, activeTab, currentUser]);

  const handleFollowToggle = async (userId: string, isFollowing: boolean) => {
    try {
      if (isFollowing) {
        await api.delete(`/users/${userId}/follow`);
        toast.success("Unfollowed user");
      } else {
        await api.post(`/users/${userId}/follow`);
        toast.success("Followed user");
      }
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    }
  };

  const handleOpenDetails = (user: any) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
  };

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-primary/10 rounded-2xl">
               <Network className="h-8 w-8 text-primary" />
             </div>
             <div>
               <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-heading">
                Network Hub
               </h2>
               <div className="flex items-center gap-2 text-slate-500 text-sm mt-0.5 font-medium">
                 <span>{analytics?.totalUsers || 0} Registered Users</span>
                 <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                 <span>{analytics?.totalConnections || 0} Professional Connections</span>
               </div>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full shadow-sm hover:shadow-md transition-all gap-2 h-11 px-5 border-slate-200 bg-white">
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export Directory</span>
          </Button>
          <Button className="rounded-full shadow-lg shadow-primary/25 gap-2 h-11 px-5 premium-button">
            <Sparkles className="h-4 w-4" />
            <span>Smart Recommendations</span>
          </Button>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sticky top-0 z-10 bg-background/80 backdrop-blur-md py-2 -mx-4 px-4">
          <TabsList className="bg-slate-100/50 p-1 rounded-full h-12 w-fit">
            <TabsTrigger value="overview" className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
            <TabsTrigger value="directory" className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Directory</TabsTrigger>
            <TabsTrigger value="following" className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Following</TabsTrigger>
            <TabsTrigger value="followers" className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Followers</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {activeTab !== "overview" && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 w-full lg:w-auto"
              >
                <div className="relative flex-1 lg:w-[320px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search name, role, or department..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-12 rounded-full bg-white border-slate-200 shadow-sm focus-visible:ring-primary/20"
                  />
                </div>
                <div className="flex bg-slate-100 p-1 rounded-full h-12 shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`rounded-full h-10 w-10 ${viewMode === 'table' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}
                    onClick={() => setViewMode('table')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`rounded-full h-10 w-10 ${viewMode === 'cards' ? 'bg-white shadow-sm text-primary' : 'text-slate-400'}`}
                    onClick={() => setViewMode('cards')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <TabsContent value="overview" className="mt-0 outline-none space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Network Density', value: `${analytics?.avgConnectionsPerUser || 0}`, icon: TrendingUp, trend: '+12% from last month', color: 'blue' },
              { label: 'Active Reach', value: `${analytics?.activeUsers || 0}`, icon: Activity, trend: '84% of total population', color: 'emerald' },
              { label: 'Connections', value: `${analytics?.totalConnections || 0}`, icon: Users, trend: '+54 new today', color: 'amber' },
              { label: 'Engagement Rate', value: '62%', icon: BarChart3, trend: 'Top 5% of universities', color: 'purple' },
            ].map((stat, i) => (
              <Card key={i} className="premium-card group overflow-hidden border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform duration-500`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <Badge variant="secondary" className="bg-slate-50 text-[10px] uppercase font-bold tracking-wider text-slate-500">Live</Badge>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-slate-500">{stat.label}</h3>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-bold text-slate-900 font-heading">{stat.value}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 font-medium">
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                      {stat.trend}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid gap-6 lg:grid-cols-7">
            <Card className="lg:col-span-4 premium-card border-slate-200/60 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-50">
                <div>
                  <CardTitle className="text-lg font-heading">Connectivity Growth</CardTitle>
                  <CardDescription>Visualizing connection patterns over the current semester.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs">1W</Button>
                  <Button variant="secondary" size="sm" className="h-8 rounded-full text-xs bg-primary/10 text-primary">1M</Button>
                  <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs">ALL</Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics?.growthData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCon" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="connections" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorCon)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 premium-card border-slate-200/60 shadow-sm">
              <CardHeader className="border-b border-slate-50 pb-4">
                <CardTitle className="text-lg font-heading">Network Diversity</CardTitle>
                <CardDescription>Composition of users by academic role.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                 <div className="h-[240px] w-full">
                    {analytics?.roleDistribution?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.roleDistribution} layout="vertical" margin={{ left: 10, right: 30 }}>
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                            width={100}
                          />
                          <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                          />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                            {analytics.roleDistribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 italic">No data</div>
                    )}
                 </div>
                 <div className="mt-4 space-y-3">
                    {analytics?.roleDistribution?.slice(0, 3).map((role: any, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                            <span className="text-sm font-medium text-slate-600">{role.name}</span>
                         </div>
                         <span className="text-sm font-bold text-slate-900">{role.count}</span>
                      </div>
                    ))}
                 </div>
              </CardContent>
            </Card>
          </div>

          <Card className="premium-card border-slate-200/60 shadow-sm overflow-hidden">
             <CardHeader className="pb-2">
                <CardTitle className="text-lg font-heading">Influential Connection Nodes</CardTitle>
                <CardDescription>Users with the highest campus reach and professional connectivity.</CardDescription>
             </CardHeader>
             <CardContent className="p-0">
                <div className="flex overflow-x-auto p-6 gap-6 scrollbar-hide">
                  {analytics?.topConnectedUsers?.map((u: any, i: number) => (
                    <motion.div 
                      key={u.id}
                      whileHover={{ y: -4 }}
                      className="flex-shrink-0 w-48 p-5 bg-slate-50/50 border border-slate-100 rounded-3xl text-center group transition-all hover:bg-white hover:shadow-xl hover:shadow-primary/10"
                    >
                      <div className="relative mx-auto w-16 h-16 mb-4">
                        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping group-hover:animate-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Avatar className="w-16 h-16 border-2 border-white shadow-md ring-2 ring-primary/10">
                          <AvatarImage src={u.avatar} />
                          <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">{u.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 bg-amber-400 text-white p-1 rounded-full border-2 border-white shadow-sm">
                           <Shield className="h-3 w-3" />
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-800 truncate mb-1">{u.name}</h4>
                      <p className="text-xs text-slate-400 font-medium mb-3">@{u.username}</p>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-100 rounded-full shadow-sm">
                        <Users className="h-3 w-3 text-primary" />
                        <span className="text-xs font-bold text-slate-700">{u.followersCount}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
             </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="directory" className="mt-0 outline-none space-y-8 animate-in fade-in duration-500">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-3 p-4 bg-slate-50/50 border border-slate-100 rounded-3xl"
          >
            <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold px-2 mr-2 border-r border-slate-200">
              <Filter className="h-4 w-4" />
              <span>ADVANCED FILTERS</span>
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[160px] h-10 rounded-full bg-white border-slate-200 shadow-sm">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="STUDENT">Students</SelectItem>
                <SelectItem value="FACULTY">Faculty</SelectItem>
                <SelectItem value="ALUMNI">Alumni</SelectItem>
                <SelectItem value="STAFF">University Staff</SelectItem>
              </SelectContent>
            </Select>

            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-[180px] h-10 rounded-full bg-white border-slate-200 shadow-sm">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[160px] h-10 rounded-full bg-white border-slate-200 shadow-sm">
                <SelectValue placeholder="Campus Branch" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(roleFilter !== 'all' || deptFilter !== 'all' || branchFilter !== 'all' || search) && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-10 rounded-full text-slate-500 hover:text-red-500"
                onClick={() => {
                  setRoleFilter('all');
                  setDeptFilter('all');
                  setBranchFilter('all');
                  setSearch('');
                }}
              >
                Clear All
              </Button>
            )}
          </motion.div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32 text-slate-400"
              >
                <div className="relative">
                   <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                   <Network className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
                </div>
                <p className="mt-6 font-medium animate-pulse">Syncing directory data...</p>
              </motion.div>
            ) : viewMode === 'table' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="premium-card border-slate-200/60 shadow-sm overflow-hidden"
              >
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="pl-8 py-4 font-bold text-slate-700">PROFILE</TableHead>
                      <TableHead className="font-bold text-slate-700">ROLE</TableHead>
                      <TableHead className="font-bold text-slate-700">ACADEMIC UNIT</TableHead>
                      <TableHead className="font-bold text-slate-700">NETWORK</TableHead>
                      <TableHead className="text-right pr-8 font-bold text-slate-700">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-20 text-slate-400">
                          <SearchX className="h-12 w-12 mx-auto mb-4 opacity-10" />
                          <p className="font-medium">No users match your criteria</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow 
                          key={user.id} 
                          className="hover:bg-slate-50/50 border-slate-50 cursor-pointer group transition-colors"
                          onClick={() => handleOpenDetails(user)}
                        >
                          <TableCell className="pl-8 py-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-11 w-11 border-2 border-white shadow-sm ring-1 ring-slate-100">
                                <AvatarImage src={user.avatar || user.imageUrl} />
                                <AvatarFallback className="bg-primary/5 text-primary font-bold">
                                  {(user.name || user.username)?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-bold text-slate-900 group-hover:text-primary transition-colors">{user.name || user.username}</div>
                                <div className="text-xs text-slate-500 font-medium tracking-tight">@{user.username || user.studentId}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 rounded-full font-bold px-3 py-0.5 text-[10px] uppercase">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-600 text-sm font-medium">
                            <div className="flex flex-col">
                               <span className="truncate max-w-[200px]">{user.department?.name || user.department || 'General'}</span>
                               <span className="text-[10px] text-slate-400 uppercase tracking-widest">{user.branch?.name || 'Main Campus'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-slate-600">
                               <Users className="h-3.5 w-3.5 text-slate-400" />
                               <span className="text-sm font-bold">{user.followersCount || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-8" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                 <MessageSquare className="h-4 w-4 text-slate-400" />
                              </Button>
                              {currentUser?.id !== user.id && (
                                <Button 
                                  variant={user.isFollowing ? "outline" : "default"} 
                                  size="sm" 
                                  className="rounded-full h-8 px-4 font-bold"
                                  onClick={() => handleFollowToggle(user.id, user.isFollowing)}
                                >
                                  {user.isFollowing ? 'Following' : 'Follow'}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {users.length === 0 ? (
                  <div className="col-span-full py-32 text-center text-slate-400 bg-slate-50/50 border border-dashed border-slate-200 rounded-[32px]">
                    <SearchX className="h-16 w-16 mx-auto mb-4 opacity-10" />
                    <p className="font-semibold text-lg">Empty Result Set</p>
                    <p className="text-sm">Try broadening your search or filter parameters.</p>
                  </div>
                ) : (
                  users.map(user => (
                    <motion.div
                      key={user.id}
                      whileHover={{ y: -6, shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.08)" }}
                      onClick={() => handleOpenDetails(user)}
                      className="premium-card group relative bg-white border border-slate-200/60 rounded-[28px] p-6 transition-all duration-300 cursor-pointer"
                    >
                      <div className="absolute top-4 right-4 flex gap-1">
                         <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-slate-300'}`}></div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className="relative mb-4">
                          <div className="absolute inset-0 bg-primary/5 rounded-full scale-125 group-hover:scale-150 transition-transform duration-700"></div>
                          <Avatar className="h-20 w-20 border-4 border-white shadow-xl ring-1 ring-slate-100 relative z-10">
                            <AvatarImage src={user.avatar || user.imageUrl} />
                            <AvatarFallback className="bg-primary/5 text-primary text-2xl font-bold">
                              {(user.name || user.username)?.[0]}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        
                        <div className="text-center w-full space-y-1">
                          <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors truncate px-2">{user.name || user.username}</h3>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">@{user.username}</p>
                        </div>

                        <div className="mt-5 w-full space-y-3">
                           <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-2xl border border-slate-100/50">
                              <GraduationCap className="h-3.5 w-3.5 text-primary/60" />
                              <span className="font-semibold truncate">{user.department?.name || user.department || 'Professional'}</span>
                           </div>
                           
                           <div className="flex items-center justify-between px-1">
                              <div className="flex items-center gap-3">
                                <div className="text-center">
                                   <p className="text-[10px] text-slate-400 font-bold uppercase">Network</p>
                                   <p className="text-sm font-bold text-slate-900">{user.followersCount || 0}</p>
                                </div>
                                <div className="w-[1px] h-6 bg-slate-100"></div>
                                <div className="text-center">
                                   <p className="text-[10px] text-slate-400 font-bold uppercase">Posts</p>
                                   <p className="text-sm font-bold text-slate-900">{Math.floor(Math.random() * 40)}</p>
                                </div>
                              </div>
                              <Badge variant="secondary" className="bg-slate-100 text-[9px] font-black tracking-tighter rounded-md px-1.5 uppercase">
                                {user.role?.slice(0, 3)}
                              </Badge>
                           </div>

                           <div className="pt-2 flex gap-2" onClick={e => e.stopPropagation()}>
                              {currentUser?.id !== user.id && (
                                <Button 
                                  variant={user.isFollowing ? "secondary" : "default"} 
                                  size="sm" 
                                  className={`flex-1 rounded-2xl h-10 font-bold transition-all ${user.isFollowing ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'premium-button shadow-md shadow-primary/20'}`}
                                  onClick={() => handleFollowToggle(user.id, user.isFollowing)}
                                >
                                  {user.isFollowing ? 'Unfollow' : 'Follow'}
                                </Button>
                              )}
                              <Button variant="outline" size="icon" className="h-10 w-10 rounded-2xl border-slate-200 hover:bg-slate-50">
                                 <MessageSquare className="h-4 w-4 text-slate-400" />
                              </Button>
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {!loading && totalPages > 1 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-3 pt-6"
            >
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 rounded-full border-slate-200 bg-white"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <MoreHorizontal className="h-4 w-4 rotate-180" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <Button 
                      key={p}
                      variant={page === p ? "default" : "outline"}
                      className={`h-10 w-10 rounded-full border-slate-200 font-bold ${page === p ? 'shadow-md shadow-primary/20' : 'bg-white'}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  );
                })}
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 rounded-full border-slate-200 bg-white"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="following" className="mt-0 outline-none animate-in fade-in duration-500">
           {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
            </div>
          ) : users.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {users.map(user => (
                  <motion.div 
                    key={user.id} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="premium-card bg-white border border-slate-200/60 rounded-[28px] p-5 flex items-center gap-4"
                  >
                    <Avatar className="h-14 w-14 border-2 border-slate-50 shadow-sm">
                      <AvatarImage src={user.avatar || user.imageUrl} />
                      <AvatarFallback className="font-bold">{(user.name || user.username)?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 truncate">{user.name || user.username}</h3>
                      <p className="text-xs text-slate-400 font-medium truncate">@{user.username}</p>
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="rounded-full h-9 px-4 font-bold bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all border border-transparent"
                      onClick={() => handleFollowToggle(user.id, true)}
                    >
                      Unfollow
                    </Button>
                  </motion.div>
               ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-slate-50/50 rounded-[40px] border border-dashed border-slate-200">
               <div className="p-4 bg-white rounded-3xl w-fit mx-auto shadow-sm border border-slate-100 mb-6">
                 <Users className="h-10 w-10 text-slate-300" />
               </div>
               <h3 className="text-xl font-bold text-slate-800">Your Network is Fresh</h3>
               <p className="text-slate-500 mt-2 max-w-sm mx-auto">Start following student leaders and faculty to build your professional dashboard.</p>
               <Button variant="default" className="mt-6 rounded-full h-12 px-8 font-bold premium-button shadow-lg shadow-primary/20" onClick={() => setActiveTab("directory")}>
                 Explore Directory
               </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="followers" className="mt-0 outline-none animate-in fade-in duration-500">
           {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
            </div>
          ) : users.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {users.map(user => (
                  <motion.div 
                    key={user.id} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="premium-card bg-white border border-slate-200/60 rounded-[28px] p-5 flex items-center gap-4"
                  >
                    <Avatar className="h-14 w-14 border-2 border-slate-50 shadow-sm">
                      <AvatarImage src={user.avatar || user.imageUrl} />
                      <AvatarFallback className="font-bold">{(user.name || user.username)?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 truncate">{user.name || user.username}</h3>
                      <p className="text-xs text-slate-400 font-medium truncate">@{user.username}</p>
                    </div>
                    {currentUser?.id !== user.id && (
                       <Button 
                          variant={user.isFollowing ? "outline" : "default"} 
                          size="sm" 
                          className={`rounded-full h-9 px-4 font-bold transition-all ${user.isFollowing ? 'border-slate-200 text-slate-500' : 'premium-button shadow-md shadow-primary/20'}`}
                          onClick={() => handleFollowToggle(user.id, user.isFollowing)}
                        >
                          {user.isFollowing ? "Mutual" : "Follow Back"}
                        </Button>
                    )}
                  </motion.div>
               ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-slate-50/50 rounded-[40px] border border-dashed border-slate-200">
               <div className="p-4 bg-white rounded-3xl w-fit mx-auto shadow-sm border border-slate-100 mb-6">
                 <Users className="h-10 w-10 text-slate-300" />
               </div>
               <h3 className="text-xl font-bold text-slate-800">New Opportunities Await</h3>
               <p className="text-slate-500 mt-2 max-w-sm mx-auto">When others follow you, their professional profiles will appear here for easy networking.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* User Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
           {selectedUser && (
             <div className="flex flex-col">
                <div className="h-32 bg-gradient-to-r from-primary/20 to-purple-500/10 relative">
                   <div className="absolute -bottom-12 left-8">
                      <Avatar className="w-24 h-24 border-4 border-white shadow-xl ring-1 ring-slate-100">
                         <AvatarImage src={selectedUser.avatar || selectedUser.imageUrl} />
                         <AvatarFallback className="bg-primary/5 text-primary text-3xl font-bold">{(selectedUser.name || selectedUser.username)?.[0]}</AvatarFallback>
                      </Avatar>
                   </div>
                   <div className="absolute top-4 right-4 flex gap-2">
                      <Button variant="white" size="icon" className="h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm border-none shadow-sm hover:bg-white" onClick={() => setIsDetailsOpen(false)}>
                         <MoreHorizontal className="h-5 w-5 text-slate-600" />
                      </Button>
                   </div>
                </div>
                
                <div className="pt-16 px-8 pb-8 space-y-6">
                   <div className="flex justify-between items-start">
                      <div>
                         <h2 className="text-2xl font-bold text-slate-900 font-heading">{selectedUser.name || selectedUser.username}</h2>
                         <p className="text-slate-500 font-medium">@{selectedUser.username} • <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] uppercase align-middle ml-1">{selectedUser.role}</Badge></p>
                      </div>
                      <div className="flex gap-2">
                         <Button variant="outline" size="icon" className="rounded-full h-11 w-11 border-slate-200">
                            <Share2 className="h-4 w-4 text-slate-500" />
                         </Button>
                         <Button className="rounded-full h-11 px-6 premium-button shadow-lg shadow-primary/20 gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Message
                         </Button>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</p>
                         <div className="flex items-center gap-2 text-slate-700 font-semibold truncate">
                            <Building2 className="h-3.5 w-3.5 text-primary/60" />
                            {selectedUser.department?.name || selectedUser.department || 'General'}
                         </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Campus Location</p>
                         <div className="flex items-center gap-2 text-slate-700 font-semibold">
                            <MapPin className="h-3.5 w-3.5 text-red-500/60" />
                            {selectedUser.branch?.name || 'Main Campus'}
                         </div>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Network Insights</h4>
                      <div className="grid grid-cols-3 gap-3">
                         {[
                           { label: 'Followers', value: selectedUser.followersCount || 0, icon: Users, color: 'blue' },
                           { label: 'Following', value: selectedUser.followingCount || 0, icon: Network, color: 'purple' },
                           { label: 'Posts', value: selectedUser.postsCount || 0, icon: Sparkles, color: 'amber' },
                         ].map((insight, i) => (
                           <div key={i} className="text-center p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
                              <insight.icon className={`h-4 w-4 mx-auto mb-1.5 text-${insight.color}-500`} />
                              <p className="text-lg font-black text-slate-900 leading-none">{insight.value}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{insight.label}</p>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                         <Clock className="h-3.5 w-3.5" />
                         Joined {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-2">
                         {selectedUser.isActive ? (
                           <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 rounded-full py-0.5 font-bold uppercase text-[9px]">
                             <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Verified Profile
                           </Badge>
                         ) : (
                           <Badge variant="secondary" className="rounded-full py-0.5 font-bold uppercase text-[9px]">
                             <AlertCircle className="h-2.5 w-2.5 mr-1" /> Pending
                           </Badge>
                         )}
                      </div>
                   </div>
                </div>
             </div>
           )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
