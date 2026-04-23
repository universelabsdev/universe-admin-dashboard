import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../../../lib/api-client";
import { useAdminService } from "../../../services/admin.service";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { toast } from "sonner";

function useCountdown(targetDate: string | undefined): string {
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!targetDate) return;
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setLabel('Closed'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 48) setLabel(`${Math.floor(h / 24)}d remaining`);
      else if (h > 0) setLabel(`${h}h ${m}m remaining`);
      else setLabel(`${m}m ${s}s remaining`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return label;
}

export default function VotingCenterPage() {
  const queryClient = useQueryClient();
  const api = useApiClient();
  const adminService = useAdminService(api);

  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);
  const [votedElections, setVotedElections] = useState<Record<string, string>>({}); // electionId -> confirmationCode
  const [regStudentId, setRegStudentId] = useState('');
  const [regFaculty, setRegFaculty] = useState('');
  const [regYear, setRegYear] = useState('1');

  // ── Voter registration status ──────────────────────────────────────────
  const { data: registrationStatus, isLoading: checkingRegistration } = useQuery({
    queryKey: ['voting', 'registration'],
    queryFn: async () => {
      // Interceptor returns ApiResponse directly; .data holds the payload
      const res = await api.get<{ isRegistered: boolean; voterId?: string }>('/elections/registration');
      return (res as any).data ?? res;
    },
    retry: false,
  });

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

  // ── Active elections ───────────────────────────────────────────────────
  const { data: elections = [], isLoading } = useQuery({
    queryKey: ['voting', 'elections'],
    queryFn: async () => {
      const res = await adminService.getElections({ status: 'active', limit: 50 });
      // Interceptor unwraps to ApiResponse; .data = { elections, total, page, limit }
      return (res as any).data?.elections ?? (res as any).elections ?? [];
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
      return await api.post<{ confirmationCode: string }>('/elections/vote', {
        electionId,
        selections: [{ positionId, candidateIds: [candidateId] }],
      });
    },
    onSuccess: (res: any, variables) => {
      // Interceptor unwraps to ApiResponse; .data holds the vote result
      const code = (res as any).data?.confirmationCode ?? (res as any).confirmationCode ?? '';
      setVotedElections(prev => ({ ...prev, [variables.electionId]: code }));
      setSelectedElectionId(null);
      toast.success('Vote cast successfully!', {
        description: code ? `Keep your confirmation code: ${code}` : undefined,
        duration: 10000,
      });
      queryClient.invalidateQueries({ queryKey: ['voting', 'elections'] });
    },
    onError: (err: any) => {
      toast.error('Failed to cast vote: ' + (err.message ?? 'Unknown error'));
    },
  });

  // ── Loading & registration wall ────────────────────────────────────────
  const isRegistered = registrationStatus?.isRegistered === true;

  if (isLoading || checkingRegistration) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-muted-foreground font-medium">Loading Voting Center...</p>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6">
        <span className="material-symbols-rounded text-6xl text-muted-foreground/30">how_to_vote</span>
        <div className="text-center">
          <h3 className="text-xl font-bold text-foreground mb-2">Voter Registration Required</h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            Complete your voter registration to participate in elections.
          </p>
        </div>
        <div className="w-full max-w-sm space-y-3">
          <input
            type="text"
            placeholder="Student ID (e.g. STU-2024-001)"
            value={regStudentId}
            onChange={e => setRegStudentId(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            type="text"
            placeholder="Faculty / Department (e.g. Engineering)"
            value={regFaculty}
            onChange={e => setRegFaculty(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <select
            title="Year of study"
            value={regYear}
            onChange={e => setRegYear(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {[1, 2, 3, 4, 5].map(y => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>
          <Button
            onClick={() => registerMutation.mutate()}
            disabled={registerMutation.isPending || !regStudentId.trim() || !regFaculty.trim()}
            className="w-full rounded-full bg-primary text-primary-foreground font-bold"
          >
            {registerMutation.isPending ? 'Registering...' : 'Register as Voter'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading">Voting Center</h2>
          <p className="text-muted-foreground mt-1">Exercise your democratic rights securely.</p>
        </div>
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 rounded-full px-4 py-1.5 font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Verified Voter
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {elections.map((election: any) => (
          <ElectionCard
            key={election.id}
            election={election}
            alreadyVoted={!!votedElections[election.id]}
            confirmationCode={votedElections[election.id]}
            onVote={() => setSelectedElectionId(election.id)}
          />
        ))}

        {elections.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <span className="material-symbols-rounded text-6xl text-muted/30 mb-6 block">how_to_vote</span>
            <p className="text-muted-foreground font-bold text-lg">No active elections at the moment</p>
            <p className="text-sm text-muted-foreground mt-2">Check back later or view past results.</p>
          </div>
        )}
      </div>

      {/* Ballot modal */}
      {selectedElection && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl bg-card">
            <CardHeader className="bg-muted/30 border-b border-border p-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black">{selectedElection.title}</CardTitle>
                <CardDescription>Select your candidate — your vote is final and cannot be changed</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedElectionId(null)} className="rounded-full" disabled={castVoteMutation.isPending}>
                <span className="material-symbols-rounded">close</span>
              </Button>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto max-h-[70vh]">
              {(selectedElection.positions?.[0]?.candidates ?? []).length === 0 ? (
                <div className="py-16 text-center">
                  <span className="material-symbols-rounded text-5xl text-muted-foreground/30 mb-4 block">person_search</span>
                  <p className="text-muted-foreground font-medium">No candidates registered for this election yet.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {(selectedElection.positions[0].candidates ?? []).map((candidate: any) => (
                    <div key={candidate.id} className="relative group">
                      <div className="p-4 bg-muted/20 border border-border rounded-2xl hover:border-primary/50 transition-all">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="h-12 w-12 rounded-full overflow-hidden bg-muted border border-border shrink-0">
                            {candidate.photo ? (
                              <img src={candidate.photo} alt={candidate.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold text-lg">
                                {(candidate.name || '?').charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <h5 className="font-bold text-foreground">{candidate.name || 'Unknown'}</h5>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase">Official Candidate</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 italic mb-4">
                          &ldquo;{candidate.manifesto || 'No manifesto available.'}&rdquo;
                        </p>
                        <Button
                          onClick={() =>
                            castVoteMutation.mutate({
                              electionId: selectedElection.id,
                              positionId: selectedElection.positions[0].id,
                              candidateId: candidate.id,
                            })
                          }
                          disabled={castVoteMutation.isPending}
                          className="w-full rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border-none font-bold text-xs"
                        >
                          {castVoteMutation.isPending ? 'Casting...' : 'Vote for this Candidate'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
