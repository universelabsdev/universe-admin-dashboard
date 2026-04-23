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

interface ElectionResults {
  electionId: string;
  title: string;
  totalVotes: number;
  eligibleVoters: number;
  turnout: number;
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
  const [lastVote, setLastVote] = useState<{ candidateId: string; timestamp: string } | null>(null);
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

      socket.on('vote_cast_update', (data: { candidateId: string; electionId: string; timestamp: string }) => {
        if (data.electionId !== electionId) return;

        setLastVote({ candidateId: data.candidateId, timestamp: data.timestamp });
        
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
              // Re-calculate percentages for all candidates based on new total
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
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground font-medium">Connecting to live results stream...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-white shadow-sm transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Live Dashboard
              </Badge>
              {isConnected ? (
                <Badge variant="outline" className="border-emerald-500/50 text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5 text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Streaming
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-500/50 text-amber-600 bg-amber-50 rounded-full px-2 py-0.5 text-[10px] font-bold">
                  Reconnecting...
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {liveResults.title}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200/60 text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Live Turnout</p>
              <p className="text-2xl font-black text-primary leading-none">
                {liveResults.turnout}%
              </p>
           </div>
           <div className="bg-slate-900 px-6 py-3 rounded-2xl shadow-lg text-right text-white">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Votes</p>
              <p className="text-2xl font-black leading-none flex items-center justify-end">
                <Users className="h-4 w-4 mr-2 text-primary" />
                {liveResults.totalVotes.toLocaleString()}
              </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
        {/* Left Column: Analytics & Status */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                Turnout Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-violet-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${liveResults.turnout}%` }}
                    transition={{ type: "spring", stiffness: 50, damping: 15 }}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Remaining</p>
                      <p className="text-xl font-bold text-slate-700">
                        {(liveResults.eligibleVoters - liveResults.totalVotes).toLocaleString()}
                      </p>
                   </div>
                   <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Eligible</p>
                      <p className="text-xl font-bold text-slate-700">
                        {liveResults.eligibleVoters.toLocaleString()}
                      </p>
                   </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                   <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Real-time Activity</h4>
                      <Zap className="h-3 w-3 text-amber-400 animate-pulse" />
                   </div>
                   <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {lastVote ? (
                          <motion.div 
                            key={lastVote.timestamp}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                               <Users className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                               <p className="text-xs font-bold text-slate-700">New vote received</p>
                               <p className="text-[10px] text-slate-400">{new Date(lastVote.timestamp).toLocaleTimeString()}</p>
                            </div>
                          </motion.div>
                        ) : (
                          <p className="text-xs text-slate-400 italic py-2">Waiting for live data...</p>
                        )}
                      </AnimatePresence>
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-slate-900 text-white">
             <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center">
                  <ShieldCheck className="h-4 w-4 mr-2 text-emerald-400" />
                  Network Integrity
                </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                   <span className="text-xs font-medium text-slate-300">Connection</span>
                   <span className="text-xs font-bold text-emerald-400">Encrypted</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                   <span className="text-xs font-medium text-slate-300">Room Status</span>
                   <span className="text-xs font-bold text-emerald-400">Authorized</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                   <span className="text-xs font-medium text-slate-300">Protocol</span>
                   <span className="text-xs font-bold text-slate-400">WSS (TLS 1.3)</span>
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Right Column: Candidate Rankings */}
        <div className="lg:col-span-8 space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                Current Standings
              </h2>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Updates Instantly
              </div>
           </div>

           <div className="grid gap-6">
             <AnimatePresence mode="popLayout">
               {sortedCandidates.map((candidate, index) => (
                 <motion.div
                   key={candidate.candidateId}
                   layout
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ 
                     type: "spring", 
                     stiffness: 100, 
                     damping: 15,
                     layout: { duration: 0.5 }
                   }}
                 >
                   <Card className="border-none shadow-md hover:shadow-xl transition-all rounded-[28px] overflow-hidden group">
                     <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                           {/* Rank and Avatar */}
                           <div className="flex items-center gap-4 shrink-0">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl transition-all ${
                                index === 0 ? 'bg-amber-100 text-amber-600 shadow-inner' : 
                                index === 1 ? 'bg-slate-100 text-slate-500 shadow-inner' :
                                index === 2 ? 'bg-orange-100 text-orange-600 shadow-inner' :
                                'bg-slate-50 text-slate-300'
                              }`}>
                                {index === 0 ? <Trophy className="h-6 w-6" /> : index + 1}
                              </div>
                              <Avatar className="h-16 w-16 border-4 border-white shadow-lg rounded-2xl">
                                <AvatarImage src={candidate.candidatePhoto} />
                                <AvatarFallback className="bg-slate-100 text-slate-400 font-bold rounded-2xl">
                                  {candidate.candidateName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                           </div>

                           {/* Name and Stats */}
                           <div className="flex-1 min-w-0 w-full">
                              <div className="flex justify-between items-end mb-2">
                                 <div>
                                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors">
                                      {candidate.candidateName}
                                    </h3>
                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                       {index === 0 ? 'Current Frontrunner' : 'Contestant'}
                                    </p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-2xl font-black text-slate-900 leading-none mb-1">
                                      {candidate.percentage}%
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                      {candidate.votes.toLocaleString()} Votes
                                    </p>
                                 </div>
                              </div>
                              
                              <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                 <motion.div 
                                    className={`absolute inset-y-0 left-0 rounded-full ${
                                      index === 0 ? 'bg-primary' : 'bg-slate-400'
                                    }`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${candidate.percentage}%` }}
                                    transition={{ type: "spring", stiffness: 60, damping: 20 }}
                                 />
                                 
                                 {/* Last vote pulse effect */}
                                 {lastVote?.candidateId === candidate.candidateId && (
                                   <motion.div 
                                      className="absolute inset-0 bg-white"
                                      initial={{ opacity: 0.5 }}
                                      animate={{ opacity: 0 }}
                                      transition={{ duration: 1 }}
                                   />
                                 )}
                              </div>
                           </div>
                        </div>
                     </CardContent>
                   </Card>
                 </motion.div>
               ))}
             </AnimatePresence>

             {sortedCandidates.length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[40px] bg-slate-50/50">
                   <BarChart3 className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                   <p className="text-slate-400 font-medium italic">No candidates found for this election.</p>
                </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
