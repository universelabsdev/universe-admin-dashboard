import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAdminService } from '@/services/admin.service';
import { useApiClient } from '@/lib/api-client';
import { 
  BadgeCheck, BadgeAlert, Loader2, Search, Filter, ScanFace, 
  CheckCircle2, XCircle, MoreHorizontal, ShieldCheck, Download,
  Fingerprint, CreditCard, RefreshCw, Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function DigitalIdManagementPage() {
  const api = useApiClient();
  const adminService = useAdminService(api);

  // State
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  
  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Stats
  const [stats, setStats] = useState({ total: 0, verified: 0, unverified: 0 });

  // Selection & Modal
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const filters: any = { 
        page, 
        limit: 12, 
        q: search
      };
      
      if (roleFilter !== 'all') filters.role = roleFilter;
      if (activeTab === 'verified') filters.isVerified = true;
      if (activeTab === 'pending') filters.isVerified = false;

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
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  // Quick separate fetch to get high-level stats based on verification
  const fetchStats = async () => {
    try {
       // A bit hacky, but fetches overall counts without specific filters
       const verifiedRes = await adminService.getUsers({ isVerified: true, limit: 1 });
       const unverifiedRes = await adminService.getUsers({ isVerified: false, limit: 1 });
       
       const verifiedCount = (verifiedRes as any).meta?.total || 0;
       const unverifiedCount = (unverifiedRes as any).meta?.total || 0;
       
       setStats({
          total: verifiedCount + unverifiedCount,
          verified: verifiedCount,
          unverified: unverifiedCount
       });
    } catch (err) {
       console.error("Failed to fetch stats", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(delay);
  }, [search, roleFilter, page, activeTab]);

  const handleVerifyToggle = async (userId: string, currentStatus: boolean) => {
    try {
      await adminService.verifyUser(userId, !currentStatus);
      toast.success(currentStatus ? "Verification Revoked" : "Identity Verified");
      
      // Update local state to reflect change instantly
      setUsers(users.map(u => u.id === userId ? { ...u, isVerified: !currentStatus } : u));
      if (selectedUser?.id === userId) {
         setSelectedUser({ ...selectedUser, isVerified: !currentStatus });
      }
      
      // Update stats optimistically
      setStats(prev => ({
         ...prev,
         verified: currentStatus ? prev.verified - 1 : prev.verified + 1,
         unverified: currentStatus ? prev.unverified + 1 : prev.unverified - 1,
      }));
    } catch (err: any) {
      toast.error(err.message || "Failed to update verification status");
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
             <div className="p-3 bg-indigo-50 rounded-2xl">
               <Fingerprint className="h-8 w-8 text-indigo-600" />
             </div>
             <div>
               <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-heading">
                Digital ID Center
               </h2>
               <div className="flex items-center gap-2 text-slate-500 text-sm mt-0.5 font-medium">
                 <span>Manage campus identity, credential issuance, and verification.</span>
               </div>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full shadow-sm hover:shadow-md transition-all gap-2 h-11 px-5 border-slate-200 bg-white" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 text-slate-500" />
            <span>Sync</span>
          </Button>
          <Button className="rounded-full shadow-lg shadow-indigo-600/25 gap-2 h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white border-none">
            <ScanFace className="h-4 w-4" />
            <span>Run Batch Verification</span>
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="premium-card overflow-hidden border-slate-200/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="p-3 rounded-2xl bg-slate-50 text-slate-600">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-slate-500">Total Registered IDs</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-slate-900 font-heading">{stats.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="premium-card overflow-hidden border-slate-200/60 shadow-sm relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100">Active</Badge>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-slate-500">Verified Credentials</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-slate-900 font-heading">{stats.verified}</span>
              </div>
              <p className="text-xs text-emerald-600 mt-2 font-medium">
                {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}% of total population
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card overflow-hidden border-slate-200/60 shadow-sm relative">
           <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                <BadgeAlert className="h-6 w-6" />
              </div>
              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Action Needed</Badge>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-slate-500">Pending Verification</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-slate-900 font-heading">{stats.unverified}</span>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                Awaiting admin review
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }} className="w-full space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sticky top-0 z-10 bg-background/80 backdrop-blur-md py-2 -mx-4 px-4">
          <TabsList className="bg-slate-100/50 p-1 rounded-full h-12 w-fit">
            <TabsTrigger value="all" className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">All Identities</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm text-amber-600 data-[state=active]:text-amber-700">Pending Review</TabsTrigger>
            <TabsTrigger value="verified" className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm text-emerald-600 data-[state=active]:text-emerald-700">Verified</TabsTrigger>
          </TabsList>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 w-full lg:w-auto"
          >
            <div className="relative flex-1 lg:w-[320px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, ID, or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10 h-12 rounded-full bg-white border-slate-200 shadow-sm focus-visible:ring-indigo-600/20"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[140px] h-12 rounded-full bg-white border-slate-200 shadow-sm">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="STUDENT">Students</SelectItem>
                <SelectItem value="FACULTY">Faculty</SelectItem>
                <SelectItem value="ALUMNI">Alumni</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>
        </div>

        <TabsContent value={activeTab} className="mt-0 outline-none space-y-8 animate-in fade-in duration-500">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32 text-slate-400"
              >
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600/30 mb-4" />
                <p className="font-medium animate-pulse">Loading identity records...</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {users.length === 0 ? (
                  <div className="col-span-full py-32 text-center text-slate-400 bg-slate-50/50 border border-dashed border-slate-200 rounded-[32px]">
                    <ShieldCheck className="h-16 w-16 mx-auto mb-4 opacity-20 text-indigo-600" />
                    <p className="font-semibold text-lg text-slate-600">No identities found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
                  </div>
                ) : (
                  users.map(user => (
                    <motion.div
                      key={user.id}
                      whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.1)" }}
                      onClick={() => handleOpenDetails(user)}
                      className={`premium-card group relative bg-white border-2 rounded-[24px] p-0 transition-all duration-300 cursor-pointer overflow-hidden ${user.isVerified ? 'border-emerald-100 hover:border-emerald-300' : 'border-slate-200 hover:border-indigo-300'}`}
                    >
                      {/* ID Card Header Bar */}
                      <div className={`h-12 w-full flex items-center justify-between px-4 ${user.isVerified ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                         <Badge variant="outline" className={`font-black tracking-widest text-[9px] uppercase border-none px-0 ${user.isVerified ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {user.role} ID
                         </Badge>
                         {user.isVerified ? (
                            <BadgeCheck className="h-5 w-5 text-emerald-500" />
                         ) : (
                            <BadgeAlert className="h-5 w-5 text-amber-500" />
                         )}
                      </div>

                      <div className="p-5 flex flex-col items-center">
                        <Avatar className="h-24 w-24 border-4 border-white shadow-lg ring-1 ring-slate-100 -mt-10 bg-white">
                          <AvatarImage src={user.avatar || user.imageUrl} />
                          <AvatarFallback className="bg-slate-50 text-slate-600 text-3xl font-bold">
                            {(user.name || user.username)?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="text-center w-full mt-3 space-y-1">
                          <h3 className="font-bold text-slate-900 truncate px-2 text-lg">{user.name || user.username}</h3>
                          <p className="text-xs text-slate-500 font-mono tracking-tight">{user.studentId || user.staffId || user.id.substring(0, 12)}</p>
                        </div>

                        <div className="w-full mt-5 pt-4 border-t border-slate-100/80 flex flex-col gap-3">
                           <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                              {user.isVerified ? (
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 rounded-md border-none px-2 py-0">Verified</Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 rounded-md border-none px-2 py-0">Pending</Badge>
                              )}
                           </div>
                           <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Department</span>
                              <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">{user.department?.name || user.department || 'N/A'}</span>
                           </div>
                        </div>

                        <div className="w-full mt-4 flex gap-2" onClick={e => e.stopPropagation()}>
                           {user.isVerified ? (
                              <Button 
                                variant="outline" 
                                className="w-full rounded-xl h-9 text-xs font-bold text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                                onClick={() => handleVerifyToggle(user.id, true)}
                              >
                                Revoke
                              </Button>
                           ) : (
                              <Button 
                                className="w-full rounded-xl h-9 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                                onClick={() => handleVerifyToggle(user.id, false)}
                              >
                                Approve ID
                              </Button>
                           )}
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
              <span className="text-sm font-medium text-slate-500">Page {page} of {totalPages}</span>
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
      </Tabs>

      {/* Identity Verification Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-slate-50">
           {selectedUser && (
             <div className="flex flex-col md:flex-row h-full">
                {/* Visual ID Card side */}
                <div className={`w-full md:w-2/5 p-8 flex flex-col items-center justify-center relative overflow-hidden ${selectedUser.isVerified ? 'bg-emerald-600' : 'bg-slate-800'}`}>
                   {/* Background pattern */}
                   <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                   
                   <div className="bg-white rounded-[20px] w-full max-w-[260px] shadow-2xl overflow-hidden relative z-10 aspect-[3/4] flex flex-col">
                      <div className="h-16 bg-slate-900 flex items-center justify-center">
                         <span className="text-white font-black tracking-widest uppercase text-xs">University ID</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center p-6 bg-white relative">
                         <Avatar className="h-28 w-28 border-4 border-white shadow-md ring-1 ring-slate-100 absolute -top-14">
                            <AvatarImage src={selectedUser.avatar || selectedUser.imageUrl} />
                            <AvatarFallback className="bg-slate-100 text-slate-600 text-3xl font-bold">{(selectedUser.name || selectedUser.username)?.[0]}</AvatarFallback>
                         </Avatar>
                         
                         <div className="mt-16 text-center w-full">
                            <h2 className="text-xl font-black text-slate-900 leading-tight">{selectedUser.name || selectedUser.username}</h2>
                            <p className="text-sm font-bold text-indigo-600 mt-1 uppercase tracking-wider">{selectedUser.role}</p>
                         </div>

                         <div className="mt-auto w-full space-y-2 border-t border-slate-100 pt-4">
                            <div>
                               <p className="text-[8px] text-slate-400 font-bold uppercase">ID Number</p>
                               <p className="text-sm font-mono font-semibold text-slate-800">{selectedUser.studentId || selectedUser.staffId || selectedUser.id.substring(0,8).toUpperCase()}</p>
                            </div>
                            <div>
                               <p className="text-[8px] text-slate-400 font-bold uppercase">Department</p>
                               <p className="text-xs font-semibold text-slate-800 truncate">{selectedUser.department?.name || selectedUser.department || 'General'}</p>
                            </div>
                         </div>
                      </div>
                      <div className={`h-10 flex items-center justify-center text-xs font-bold text-white uppercase tracking-widest ${selectedUser.isVerified ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                         {selectedUser.isVerified ? 'Valid Identity' : 'Pending Review'}
                      </div>
                   </div>
                </div>
                
                {/* Data side */}
                <div className="w-full md:w-3/5 p-8 bg-white flex flex-col h-full">
                   <div className="flex justify-between items-start mb-8">
                      <div>
                         <h3 className="text-2xl font-bold text-slate-900 font-heading">Verification Protocol</h3>
                         <p className="text-slate-500 text-sm mt-1">Review identity data against university records.</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400" onClick={() => setIsDetailsOpen(false)}>
                         <XCircle className="h-5 w-5" />
                      </Button>
                   </div>

                   <div className="space-y-6 flex-1">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Primary Email</p>
                            <div className="flex items-center gap-2">
                               <Mail className="h-3.5 w-3.5 text-slate-400" />
                               <span className="text-sm font-semibold text-slate-700 truncate">{selectedUser.email}</span>
                            </div>
                         </div>
                         <div className="space-y-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">System UID</p>
                            <p className="text-xs font-mono text-slate-600 truncate">{selectedUser.id}</p>
                         </div>
                      </div>

                      <div className="space-y-3">
                         <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-indigo-600" />
                            Authentication Checks
                         </h4>
                         <div className="border border-slate-200 rounded-2xl overflow-hidden">
                            <div className="flex items-center justify-between p-3 bg-white border-b border-slate-100">
                               <span className="text-sm font-medium text-slate-700">Email Verified (Clerk)</span>
                               {selectedUser.emailVerified ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 border-b border-slate-100">
                               <span className="text-sm font-medium text-slate-700">Profile Data Complete</span>
                               {selectedUser.name && selectedUser.studentId ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-amber-500" />}
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white">
                               <span className="text-sm font-medium text-slate-700">Administrative Approval</span>
                               {selectedUser.isVerified ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-amber-500" />}
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="pt-6 mt-6 border-t border-slate-100 flex gap-3">
                      {selectedUser.isVerified ? (
                         <>
                            <Button 
                              variant="outline" 
                              className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-200"
                              onClick={() => { handleVerifyToggle(selectedUser.id, true); setIsDetailsOpen(false); }}
                            >
                              Revoke Digital ID
                            </Button>
                            <Button variant="secondary" className="h-12 w-12 rounded-xl p-0">
                               <Download className="h-5 w-5 text-slate-600" />
                            </Button>
                         </>
                      ) : (
                         <>
                            <Button 
                              variant="outline" 
                              className="flex-1 h-12 rounded-xl font-bold text-slate-600"
                              onClick={() => setIsDetailsOpen(false)}
                            >
                              Request More Info
                            </Button>
                            <Button 
                              className="flex-1 h-12 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
                              onClick={() => { handleVerifyToggle(selectedUser.id, false); setIsDetailsOpen(false); }}
                            >
                              <BadgeCheck className="h-4 w-4 mr-2" /> Approve Identity
                            </Button>
                         </>
                      )}
                   </div>
                </div>
             </div>
           )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
