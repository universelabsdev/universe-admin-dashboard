import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../../../lib/api-client";
import { useAdminService } from "../../../services/admin.service";
import { useUser } from "../../../hooks/useUser";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { toast } from "sonner";
import { 
  ShieldCheck, 
  Timer, 
  Lock, 
  Calendar, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ElectionStatus = 'UPCOMING' | 'LIVE' | 'ENDED' | 'CLOSED' | 'RESTRICTED';

function getElectionStatus(election: any, user: any): { status: ElectionStatus; reason?: string } {
  const now = new Date();
  const start = new Date(election.votingStartDate || election.startDate);
  const end = new Date(election.votingEndDate || election.endDate);

  // 1. Branch/Department Check (Robustness)
  if (election.branchId && user?.branchId && election.branchId !== user.branchId) {
    return { status: 'RESTRICTED', reason: 'Restricted to your specific branch' };
  }

  // 2. Time Checks
  if (now < start) {
    return { status: 'UPCOMING', reason: `Starts ${start.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` };
  }
  
  if (now > end) {
    return { status: 'ENDED', reason: 'Voting period has concluded' };
  }

  // 3. Status Check
  if (election.status === 'CLOSED' || election.status === 'COMPLETED') {
    return { status: 'CLOSED', reason: 'Election is officially closed' };
  }

  return { status: 'LIVE' };
}

function useCountdown(targetDate: string | undefined): { label: string; isNearEnd: boolean; isPassed: boolean } {
  const [data, setData] = useState({ label: '', isNearEnd: false, isPassed: false });

  useEffect(() => {
    if (!targetDate) return;
    const update = () => {
      const now = Date.now();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setData({ label: 'Closed', isNearEnd: false, isPassed: true });
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      let label = '';
      if (h > 48) label = `${Math.floor(h / 24)}d remaining`;
      else if (h > 0) label = `${h}h ${m}m remaining`;
      else label = `${m}m ${s}s remaining`;

      setData({
        label,
        isNearEnd: diff < 3600000, // Less than 1 hour
        isPassed: false
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return data;
}

function ElectionCard({
  election,
  user,
  alreadyVoted,
  confirmationCode,
  onVote,
}: {
  election: any;
  user: any;
  alreadyVoted: boolean;
  confirmationCode?: string;
  onVote: () => void;
}) {
  const { status, reason } = getElectionStatus(election, user);
  const { label: countdown, isNearEnd } = useCountdown(election.votingEndDate || election.endDate);

  const getStatusBadge = () => {
    switch (status) {
      case 'LIVE':
        return alreadyVoted ? (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 rounded-full font-bold">Voted</Badge>
        ) : (
          <Badge className="bg-emerald-500 text-white border-none rounded-full animate-pulse px-3">Live Now</Badge>
        );
      case 'UPCOMING':
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 rounded-full font-bold">Upcoming</Badge>;
      case 'RESTRICTED':
        return <Badge variant="destructive" className="bg-rose-500/10 text-rose-600 border-rose-500/20 rounded-full font-bold">Restricted</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-400 border-slate-200 rounded-full font-bold italic">Ended</Badge>;
    }
  };

  return (
    <Card className="group relative border-none overflow-hidden rounded-[32px] shadow-sm hover:shadow-2xl transition-all duration-500 bg-white">
      {/* Visual Header */}
      <div className="h-40 w-full relative overflow-hidden">
        <img
          src={election.coverImage || 'https://images.unsplash.com/photo-1540910419892-f3174207baec?q=80&w=2070&auto=format&fit=crop'}
          alt={election.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
          {getStatusBadge()}
          {isNearEnd && status === 'LIVE' && !alreadyVoted && (
            <Badge className="bg-rose-500 text-white border-none rounded-full text-[10px] animate-bounce px-2 py-0.5">Closes Soon!</Badge>
          )}
        </div>
        
        {/* Title Overlay */}
        <div className="absolute bottom-4 left-6 right-6">
          <h3 className="text-xl font-black text-white leading-tight drop-shadow-md">
            {election.title}
          </h3>
        </div>
      </div>

      <CardContent className="p-6 space-y-4">
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed h-8 italic">
          {election.description || 'No description provided.'}
        </p>

        <div className="grid grid-cols-2 gap-3 pt-2">
           <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100">
             <div className="p-1.5 rounded-lg bg-white shadow-sm">
                <Timer className={cn("h-3 w-3", isNearEnd ? "text-rose-500" : "text-primary")} />
             </div>
             <div className="min-w-0">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Time</p>
               <p className="text-[10px] font-black text-slate-700 truncate">{countdown || 'N/A'}</p>
             </div>
           </div>
           <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100">
             <div className="p-1.5 rounded-lg bg-white shadow-sm">
                <MapPin className="h-3 w-3 text-primary" />
             </div>
             <div className="min-w-0">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Scope</p>
               <p className="text-[10px] font-black text-slate-700 truncate">{election.branch?.name || 'Global'}</p>
             </div>
           </div>
        </div>

        {alreadyVoted ? (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-black text-emerald-700 uppercase">Vote Recorded</p>
              <p className="text-[9px] font-mono text-emerald-600/70 truncate">{confirmationCode}</p>
            </div>
          </div>
        ) : (
          <Button
            onClick={onVote}
            disabled={status !== 'LIVE'}
            className={cn(
              "w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg",
              status === 'LIVE' 
                ? "bg-primary hover:bg-primary/90 text-white shadow-primary/20" 
                : "bg-slate-100 text-slate-400 shadow-none border border-slate-200"
            )}
          >
            {status === 'LIVE' ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Cast Your Ballot
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {reason || 'Voting Locked'}
              </span>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function VotingCenterPage() {
  const queryClient = useQueryClient();
  const api = useApiClient();
  const adminService = useAdminService(api);
  const { user } = useUser();

  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);
  const [votedElections, setVotedElections] = useState<Record<string, string>>({});
  const [regStudentId, setRegStudentId] = useState('');
  const [regFaculty, setRegFaculty] = useState('');
  const [regYear, setRegYear] = useState('1');

  // ── Voter registration status ──────────────────────────────────────────
  const { data: registrationStatus, isLoading: checkingRegistration } = useQuery({
    queryKey: ['voting', 'registration'],
    queryFn: async () => {
      const res = await api.get<{ isRegistered: boolean; voterId?: string; votedElections?: string[] }>('/elections/registration');
      return (res as any).data ?? res;
    },
    retry: false,
  });

  // Sync voted elections from registration status
  useEffect(() => {
    if (registrationStatus?.votedElections) {
      const votedMap: Record<string, string> = {};
      registrationStatus.votedElections.forEach((id: string) => {
        votedMap[id] = 'PREVIOUSLY_RECORDED';
      });
      setVotedElections(votedMap);
    }
  }, [registrationStatus]);

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!regStudentId.trim() || !regFaculty.trim()) {
        throw new Error('Student ID and faculty are required');
      }
      return await api.post('/elections/register', {
        studentId: regStudentId.trim(),
        faculty: regFaculty.trim(),
        yearOfStudy: parseInt(regYear, 10) || 1,
        biometricEnabled: false,
      });
    },
    onSuccess: () => {
      toast.success('Successfully registered as a voter!');
      queryClient.invalidateQueries({ queryKey: ['voting', 'registration'] });
    },
    onError: (err: any) => {
      toast.error('Registration failed: ' + err.message);
    },
  });

  // ── Active and Upcoming elections ──────────────────────────────────────
  const { data: elections = [], isLoading } = useQuery({
    queryKey: ['voting', 'elections'],
    queryFn: async () => {
      // Fetch 'all' to be intelligent about upcoming/restricted ones
      const res = await adminService.getElections({ status: 'all', limit: 50 });
      const items = (res as any).data?.elections ?? (res as any).elections ?? [];
      
      // Intelligent filtering: hide DRAFT and only show those relevant to user
      return items.filter((e: any) => e.status !== 'DRAFT');
    },
  });

  const selectedElection = elections.find((e: any) => e.id === selectedElectionId);

  // ── Cast vote ──────────────────────────────────────────────────────────
  const castVoteMutation = useMutation({
    mutationFn: async ({
      electionId,
      positionId,
      candidateId,
    }: {
      electionId: string;
      positionId: string;
      candidateId: string;
    }) => {
      // Double check eligibility before sending to backend
      const election = elections.find((e: any) => e.id === electionId);
      const { status, reason } = getElectionStatus(election, user);
      
      if (status !== 'LIVE') {
        throw new Error(reason || 'Election is not open for voting.');
      }

      return await api.post<{ confirmationCode: string }>('/elections/vote', {
        electionId,
        selections: [{ positionId, candidateIds: [candidateId] }],
      });
    },
    onSuccess: (res: any, variables) => {
      const code = (res as any).data?.confirmationCode ?? (res as any).confirmationCode ?? '';
      setVotedElections(prev => ({ ...prev, [variables.electionId]: code }));
      setSelectedElectionId(null);
      toast.success('Vote cast successfully!', {
        description: code ? `Confirmation Code: ${code}` : 'Your vote has been secured.',
        icon: <ShieldCheck className="h-5 w-5 text-emerald-500" />,
        duration: 10000,
      });
      queryClient.invalidateQueries({ queryKey: ['voting', 'elections'] });
    },
    onError: (err: any) => {
      toast.error('Voting Failed', {
        description: err.message || 'The election may have closed or you are not eligible.',
        icon: <AlertCircle className="h-5 w-5 text-rose-500" />,
      });
    },
  });

  // ── Loading & registration wall ────────────────────────────────────────
  const isRegistered = registrationStatus?.isRegistered === true;

  if (isLoading || checkingRegistration) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-slate-50">
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-t-2 border-primary animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Timer className="h-8 w-8 text-primary animate-pulse" />
          </div>
        </div>
        <p className="text-slate-400 font-black tracking-widest uppercase text-[10px]">Accessing Secure Ballot Box</p>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white p-10 rounded-[48px] shadow-2xl shadow-slate-200 border border-slate-100 text-center"
        >
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <ShieldCheck className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-4 uppercase italic">Voter ID Required</h3>
          <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">
            You must register your student identity to participate in university governance.
          </p>

          <div className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Student ID</label>
              <input
                type="text"
                placeholder="STU-2024-XXXX"
                value={regStudentId}
                onChange={e => setRegStudentId(e.target.value)}
                className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-900 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Faculty / Dept</label>
              <input
                type="text"
                placeholder="e.g. Computing"
                value={regFaculty}
                onChange={e => setRegFaculty(e.target.value)}
                className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-900 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Current Year</label>
              <select
                value={regYear}
                onChange={e => setRegYear(e.target.value)}
                className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-900 focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none"
              >
                {[1, 2, 3, 4, 5].map(y => (
                  <option key={y} value={y}>Year {y} Student</option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={() => registerMutation.mutate()}
            disabled={registerMutation.isPending || !regStudentId.trim() || !regFaculty.trim()}
            className="w-full h-16 mt-10 rounded-[28px] bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95"
          >
            {registerMutation.isPending ? 'Verifying Identity...' : 'Initialize Voter Registration'}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 space-y-10">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                <CheckCircle2 className="h-3 w-3 mr-2" />
                Identity Secured
              </div>
              <div className="flex items-center bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                <Clock className="h-3 w-3 mr-2" />
                Live Sync Active
              </div>
            </div>
            <h2 className="text-5xl font-black tracking-tighter text-slate-900 italic uppercase">Voting Center</h2>
            <p className="text-slate-500 mt-2 font-medium max-w-lg">
              Secure, transparent, and intelligent governance. Browse active and upcoming elections below.
            </p>
          </div>
          <div className="bg-white p-4 px-8 rounded-[32px] shadow-sm border border-slate-100 text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Authenticated As</p>
            <p className="text-xl font-black text-slate-800">{user?.name || 'Verified Voter'}</p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {elections.map((election: any) => (
            <ElectionCard
              key={election.id}
              election={election}
              user={user}
              alreadyVoted={!!votedElections[election.id]}
              confirmationCode={votedElections[election.id]}
              onVote={() => setSelectedElectionId(election.id)}
            />
          ))}

          {elections.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white rounded-[64px] border-2 border-dashed border-slate-100">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-10 w-10 text-slate-300" />
              </div>
              <p className="text-slate-400 font-black text-xl uppercase tracking-tight italic">No Elections Found</p>
              <p className="text-sm text-slate-400 mt-2">Check back later for upcoming university polls.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modern Ballot modal */}
      <AnimatePresence>
        {selectedElection && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedElectionId(null)}
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-3xl rounded-[48px] overflow-hidden shadow-2xl bg-white"
            >
              <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-primary/10 text-primary border-none rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">Official Ballot</Badge>
                  </div>
                  <CardTitle className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{selectedElection.title}</CardTitle>
                  <CardDescription className="text-slate-500 font-medium text-sm mt-1">
                    Select your preferred candidate. This action is encrypted and final.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedElectionId(null)} className="rounded-2xl h-14 w-14 bg-slate-50" disabled={castVoteMutation.isPending}>
                  <Lock className="h-6 w-6 text-slate-400" />
                </Button>
              </div>
              
              <div className="p-10 overflow-y-auto max-h-[60vh] custom-scrollbar bg-slate-50/30">
                {(selectedElection.positions?.[0]?.candidates ?? []).length === 0 ? (
                  <div className="py-20 text-center">
                    <Info className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-black italic">Candidate registration in progress...</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {(selectedElection.positions[0].candidates ?? []).map((candidate: any) => (
                      <div key={candidate.id} className="relative group">
                        <div className="p-6 bg-white border border-slate-100 rounded-[32px] hover:border-primary transition-all shadow-sm hover:shadow-xl group">
                          <div className="flex items-center gap-5 mb-6">
                            <div className="h-16 w-16 rounded-[24px] overflow-hidden bg-slate-100 border-4 border-white shadow-lg shrink-0">
                              {candidate.photo || candidate.imageUrl ? (
                                <img src={candidate.photo || candidate.imageUrl} alt={candidate.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-2xl">
                                  {(candidate.name || '?').charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <h5 className="font-black text-slate-900 text-lg group-hover:text-primary transition-colors">{candidate.name || 'Unknown'}</h5>
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Verified Candidate</p>
                            </div>
                          </div>
                          
                          <div className="mb-8 min-h-[60px] relative">
                             <div className="absolute top-0 left-0 text-3xl text-primary/10 font-serif leading-none">“</div>
                             <p className="text-xs text-slate-500 font-medium italic leading-relaxed px-4 pt-2">
                               {candidate.manifesto || 'Candidate has not submitted a manifesto.'}
                             </p>
                          </div>

                          <Button
                            onClick={() =>
                              castVoteMutation.mutate({
                                electionId: selectedElection.id,
                                positionId: selectedElection.positions[0].id,
                                candidateId: candidate.id,
                              })
                            }
                            disabled={castVoteMutation.isPending}
                            className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-primary text-white font-black text-xs uppercase tracking-[0.2em] transition-all"
                          >
                            {castVoteMutation.isPending ? 'Securing Vote...' : 'Select Candidate'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Security Footer */}
              <div className="p-6 bg-slate-900 text-center">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                   <ShieldCheck className="h-3 w-3" />
                   E2E Encrypted • Identity Anonymized • Audit Log Generated
                 </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
      `}} />
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

