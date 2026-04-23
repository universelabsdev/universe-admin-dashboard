import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Users, 
  Trophy, 
  TrendingUp, 
  Clock, 
  ShieldCheck,
  Zap,
  BarChart3
} from 'lucide-react';

import { useApiClient } from '@/lib/api-client';
import { useAdminService } from '@/services/admin.service';
import { socketService } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CandidateResult {
  candidateId: string;
  candidateName: string;
  candidatePhoto?: string;
  votes: number;
  percentage: number;
}

interface Voter {
  id: string;
  name: string;
  avatar?: string;
  timestamp: string;
  department?: string;
}

interface ElectionResults {
  electionId: string;
  title: string;
  totalVotes: number;
  eligibleVoters: number;
  turnout: number;
  recentVoters?: Voter[];
  positions: Array<{
    positionId: string;
    positionName: string;
    results: CandidateResult[];
  }>;
}

export default function LiveResultsPage() {
  const { id: electionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const api = useApiClient();
  const adminService = useAdminService(api);
  const { getToken } = useAuth();

  const [liveResults, setLiveResults] = useState<ElectionResults | null>(null);
  const [recentVoters, setRecentVoters] = useState<Voter[]>([]);
  const [lastVote, setLastVote] = useState<{ candidateId: string; timestamp: string; voter?: Voter } | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initial data load
  const { data: initialData, isLoading } = useQuery({
    queryKey: ['election', 'results', electionId],
    queryFn: async () => {
      const res = await adminService.getElectionResults(electionId!);
      return res.data as ElectionResults;
    },
    enabled: !!electionId,
  });

  // Sync liveResults with initialData when it arrives
  useEffect(() => {
    if (initialData) {
      setLiveResults(initialData);
      if (initialData.recentVoters) {
        setRecentVoters(initialData.recentVoters);
      }
    }
  }, [initialData]);

  // Socket.io Integration
  useEffect(() => {
    const initSocket = async () => {
      if (!electionId) return;
      
      const token = await getToken();
      if (!token) return;

      const socket = socketService.connect(token);

      socket.on('connect', () => {
        setIsConnected(true);
        socketService.joinRoom(`election_results_${electionId}`);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('vote_cast_update', (data: { 
        candidateId: string; 
        electionId: string; 
        timestamp: string;
        voter?: Voter;
      }) => {
        if (data.electionId !== electionId) return;

        setLastVote({ 
          candidateId: data.candidateId, 
          timestamp: data.timestamp,
          voter: data.voter 
        });

        if (data.voter) {
          setRecentVoters(prev => [data.voter!, ...prev].slice(0, 10));
        }
        
        setLiveResults(prev => {
          if (!prev) return null;

          const newTotalVotes = prev.totalVotes + 1;
          const newPositions = prev.positions.map(pos => ({
            ...pos,
            results: pos.results.map(cand => {
              const isTarget = cand.candidateId === data.candidateId;
              const newVotes = cand.votes + (isTarget ? 1 : 0);
              return {
                ...cand,
                votes: newVotes,
                percentage: Number(((newVotes / newTotalVotes) * 100).toFixed(1))
              };
            }).map(cand => ({
              ...cand,
              percentage: Number(((cand.votes / newTotalVotes) * 100).toFixed(1))
            }))
          }));

          return {
            ...prev,
            totalVotes: newTotalVotes,
            turnout: Number(((newTotalVotes / prev.eligibleVoters) * 100).toFixed(1)),
            positions: newPositions
          };
        });
      });

      return socket;
    };

    let socketRef: any = null;
    initSocket().then(socket => {
      socketRef = socket;
    });

    return () => {
      if (socketRef) {
        socketService.leaveRoom(`election_results_${electionId}`);
        socketRef.off('vote_cast_update');
      }
    };
  }, [electionId, getToken]);

  const sortedCandidates = useMemo(() => {
    if (!liveResults || !liveResults.positions[0]) return [];
    return [...liveResults.positions[0].results].sort((a, b) => b.votes - a.votes);
  }, [liveResults]);

  if (isLoading || !liveResults) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-slate-900">
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-t-2 border-r-2 border-primary animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="h-8 w-8 text-primary animate-pulse" />
          </div>
        </div>
        <p className="text-slate-400 font-black tracking-widest uppercase text-xs">Establishing Secure Stream</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-8 space-y-8 text-white overflow-x-hidden">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-6">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 text-white shadow-2xl transition-all h-14 w-14"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center bg-primary/20 text-primary border border-primary/30 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-ping" />
                Live Control Center
              </div>
              {isConnected ? (
                <div className="flex items-center bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                  Active Link
                </div>
              ) : (
                <div className="flex items-center bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                  Connecting...
                </div>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none italic uppercase">
              {liveResults.title}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="bg-white/5 backdrop-blur-xl px-8 py-4 rounded-[32px] border border-white/10 shadow-2xl">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Current Turnout</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">{liveResults.turnout}</span>
                <span className="text-xl font-bold text-primary">%</span>
              </div>
           </div>
           <div className="bg-primary px-8 py-4 rounded-[32px] shadow-[0_20px_40px_-10px_rgba(var(--primary),0.3)] border border-primary/20">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">Verified Votes</p>
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-white" />
                <span className="text-4xl font-black text-white">{liveResults.totalVotes.toLocaleString()}</span>
              </div>
           </div>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto">
        {/* Left Column: Rankings */}
        <div className="lg:col-span-8 space-y-6">
           <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center italic">
                <Trophy className="h-6 w-6 mr-3 text-amber-400" />
                Real-Time Standings
              </h2>
           </div>

           <div className="grid gap-4">
             <AnimatePresence mode="popLayout">
               {sortedCandidates.map((candidate, index) => (
                 <motion.div
                   key={candidate.candidateId}
                   layout
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ 
                     type: "spring", 
                     stiffness: 100, 
                     damping: 20,
                     layout: { duration: 0.4 }
                   }}
                 >
                   <div className={`relative group p-1 rounded-[36px] transition-all ${
                     index === 0 ? 'bg-gradient-to-r from-amber-400/20 via-primary/20 to-transparent' : 'bg-white/5'
                   }`}>
                     <div className="bg-[#1e293b]/80 backdrop-blur-xl rounded-[34px] p-6 border border-white/10 overflow-hidden">
                        {/* Progress Background Overlay */}
                        <motion.div 
                          className={`absolute inset-y-0 left-0 opacity-[0.03] pointer-events-none ${
                            index === 0 ? 'bg-amber-400' : 'bg-primary'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${candidate.percentage}%` }}
                          transition={{ type: "spring", stiffness: 40, damping: 20 }}
                        />

                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                           {/* Rank and Avatar */}
                           <div className="flex items-center gap-6 shrink-0">
                              <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center font-black text-2xl transition-all shadow-2xl ${
                                index === 0 ? 'bg-amber-400 text-slate-900 rotate-[-4deg]' : 
                                index === 1 ? 'bg-slate-300 text-slate-900 rotate-[2deg]' :
                                index === 2 ? 'bg-orange-400 text-slate-900 rotate-[-2deg]' :
                                'bg-white/10 text-white'
                              }`}>
                                {index === 0 ? <Trophy className="h-8 w-8" /> : index + 1}
                              </div>
                              <div className="relative">
                                <Avatar className="h-20 w-20 border-4 border-white/10 shadow-2xl rounded-[28px]">
                                  <AvatarImage src={candidate.candidatePhoto} />
                                  <AvatarFallback className="bg-slate-800 text-slate-400 font-black text-2xl rounded-[28px]">
                                    {candidate.candidateName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                {index === 0 && (
                                  <div className="absolute -top-2 -right-2 bg-amber-400 text-slate-900 p-1.5 rounded-xl shadow-xl animate-bounce">
                                    <Trophy className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                           </div>

                           {/* Name and Stats */}
                           <div className="flex-1 min-w-0 w-full">
                              <div className="flex justify-between items-end mb-4">
                                 <div>
                                    <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors tracking-tight">
                                      {candidate.candidateName}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {index === 0 ? 'Projected Winner' : 'Challenger'}
                                      </span>
                                      <div className="flex gap-1">
                                        {[1, 2, 3].map(i => (
                                          <div key={i} className={`h-1 w-4 rounded-full ${i <= (3 - index) ? 'bg-primary' : 'bg-white/10'}`} />
                                        ))}
                                      </div>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <div className="flex items-baseline gap-1 justify-end">
                                      <span className="text-4xl font-black text-white">{candidate.percentage}</span>
                                      <span className="text-lg font-bold text-primary">%</span>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                      {candidate.votes.toLocaleString()} Verified Votes
                                    </p>
                                 </div>
                              </div>
                              
                              <div className="relative h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                 <motion.div 
                                    className={`absolute inset-y-0 left-0 rounded-full shadow-[0_0_20px_rgba(var(--primary),0.5)] ${
                                      index === 0 ? 'bg-gradient-to-r from-amber-400 to-amber-200' : 'bg-gradient-to-r from-primary to-violet-500'
                                    }`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${candidate.percentage}%` }}
                                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                                 />
                                 
                                 {/* Last vote pulse effect */}
                                 {lastVote?.candidateId === candidate.candidateId && (
                                   <motion.div 
                                      className="absolute inset-0 bg-white"
                                      initial={{ opacity: 0.8, scaleX: 0 }}
                                      animate={{ opacity: 0, scaleX: 1 }}
                                      transition={{ duration: 0.8 }}
                                   />
                                 )}
                              </div>
                           </div>
                        </div>
                     </div>
                   </div>
                 </motion.div>
               ))}
             </AnimatePresence>
           </div>
        </div>

        {/* Right Column: Real-time Voter Feed */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-2xl rounded-[40px] overflow-hidden bg-white/5 backdrop-blur-3xl border border-white/10">
            <CardHeader className="pb-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-amber-400" />
                  Live Voter Feed
                </CardTitle>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Real-time</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto custom-scrollbar p-6 space-y-4">
                <AnimatePresence mode="popLayout" initial={false}>
                  {recentVoters.map((voter, index) => (
                    <motion.div
                      key={`${voter.id}-${voter.timestamp}`}
                      layout
                      initial={{ opacity: 0, y: -20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`flex items-center gap-4 p-4 rounded-[24px] border border-white/5 transition-all ${
                        index === 0 ? 'bg-primary/10 border-primary/20 ring-1 ring-primary/10' : 'bg-white/5'
                      }`}
                    >
                      <Avatar className="h-12 w-12 border-2 border-white/10 rounded-[16px] shrink-0">
                        <AvatarImage src={voter.avatar} />
                        <AvatarFallback className="bg-slate-800 text-slate-400 font-bold rounded-[16px]">
                          {voter.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-black text-white truncate">
                            {voter.name}
                          </p>
                          <span className="text-[10px] font-bold text-slate-500">
                            {new Date(voter.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[8px] h-4 bg-white/5 border-white/10 text-slate-400 font-black uppercase tracking-wider rounded-md">
                            {voter.department || 'Verified'}
                          </Badge>
                          <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Vote Secured
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {recentVoters.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                      <Users className="h-8 w-8 text-slate-700" />
                    </div>
                    <p className="text-slate-500 font-bold italic text-sm">Waiting for the first vote...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl rounded-[40px] overflow-hidden bg-slate-900 border border-white/5">
             <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                  Network Integrity Engine
                </CardTitle>
             </CardHeader>
             <CardContent className="space-y-3 pb-8">
                {[
                  { label: 'Encryption', value: 'TLS 1.3 AES-256', status: 'secure' },
                  { label: 'Validation', value: 'Zero-Knowledge Proof', status: 'active' },
                  { label: 'Sync Rate', value: '< 45ms', status: 'optimal' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-[20px] bg-white/5 border border-white/5">
                     <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                     <div className="text-right">
                       <p className="text-[10px] font-black text-white uppercase">{item.value}</p>
                       <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{item.status}</p>
                     </div>
                  </div>
                ))}
             </CardContent>
          </Card>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </div>
  );
}
