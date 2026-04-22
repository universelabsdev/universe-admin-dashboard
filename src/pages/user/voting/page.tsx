import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../../../lib/api-client";
import { useAdminService } from "../../../services/admin.service";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Progress } from "../../../components/ui/progress";
import { Badge } from "../../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { toast } from "sonner";
import { useUser } from "../../../hooks/useUser";

export default function VotingCenterPage() {
  const queryClient = useQueryClient();
  const api = useApiClient();
  const adminService = useAdminService(api);
  useUser();

  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);
  const [regStudentId, setRegStudentId] = useState('');
  const [regFaculty, setRegFaculty] = useState('');
  const [regYear, setRegYear] = useState('1');

  // Check voter registration status
  const { data: registrationStatus, isLoading: checkingRegistration } = useQuery({
    queryKey: ['voting', 'registration'],
    queryFn: async () => {
      const res = await api.get('/elections/registration');
      return (res as any).data ?? res;
    },
    retry: false,
  });

  // Register user as voter
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

  // Elections Query
  const { data: elections = [], isLoading } = useQuery({
    queryKey: ['voting', 'elections'],
    queryFn: async () => {
      const res = await adminService.getElections({ status: 'active', limit: 50 });
      return res.data?.elections || (res as any).elections || [];
    },
  });

  const selectedElection = elections.find((e: any) => e.id === selectedElectionId);

  const castVoteMutation = useMutation({
    mutationFn: async ({ electionId, positionId, candidateId }: { electionId: string, positionId: string, candidateId: string }) => {
      return await api.post('/elections/vote', {
        electionId,
        selections: [{
          positionId,
          candidateIds: [candidateId]
        }]
      });
    },
    onSuccess: (res: any) => {
      toast.success("Vote cast successfully!", {
        description: `Confirmation Code: ${res.data?.confirmationCode || res.confirmationCode}`,
      });
      setSelectedElectionId(null);
      queryClient.invalidateQueries({ queryKey: ['voting', 'elections'] });
    },
    onError: (err: any) => {
      toast.error("Failed to cast vote: " + (err.response?.data?.error || err.message));
    }
  });

  const isRegistered = registrationStatus?.isRegistered === true;

  if (isLoading || checkingRegistration) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
            {registerMutation.isPending ? "Registering..." : "Register as Voter"}
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
          <Card key={election.id} className="premium-card border-none overflow-hidden rounded-3xl shadow-lg bg-card text-card-foreground group hover:shadow-xl transition-all duration-300">
            <div className="h-32 w-full relative">
              <img 
                src={election.coverImage || "https://images.unsplash.com/photo-1540910419892-f3174207baec?q=80&w=2070&auto=format&fit=crop"} 
                alt={election.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <Badge className="absolute top-4 right-4 bg-emerald-500 text-white border-none rounded-full">Active</Badge>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold line-clamp-1">{election.title}</CardTitle>
              <CardDescription className="line-clamp-2 text-xs">
                {election.description || "No description provided."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Ends</span>
                  <span className="text-foreground">{new Date(election.votingEndDate).toLocaleDateString()}</span>
                </div>
                <Button 
                  onClick={() => setSelectedElectionId(election.id)}
                  className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                >
                  View Ballot & Vote
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {elections.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <span className="material-symbols-rounded text-6xl text-muted/30 mb-6">how_to_vote</span>
            <p className="text-muted-foreground font-bold text-lg">No active elections at the moment</p>
            <p className="text-sm text-muted-foreground mt-2">Check back later or view past results.</p>
          </div>
        )}
      </div>

      {/* Voting Dialog/Modal (Simplified as a conditional view) */}
      {selectedElection && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl bg-card">
            <CardHeader className="bg-muted/30 border-b border-border p-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black">{selectedElection.title}</CardTitle>
                <CardDescription>Select your candidate below</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedElectionId(null)} className="rounded-full">
                <span className="material-symbols-rounded">close</span>
              </Button>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid gap-4 sm:grid-cols-2">
                {(selectedElection.positions?.[0]?.candidates ?? []).map((candidate: any) => (
                  <div key={candidate.id} className="relative group">
                    <div className="p-4 bg-muted/20 border border-border rounded-2xl hover:border-primary/50 transition-all">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="h-12 w-12 rounded-full overflow-hidden bg-muted border border-border">
                          {candidate.photo ? (
                            <img src={candidate.photo} alt={candidate.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold text-lg">
                              {(candidate.name || '?').charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <h5 className="font-bold text-foreground">{candidate.name || candidate.optionText || 'Unknown'}</h5>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase">Official Candidate</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 italic mb-4">
                        "{candidate.manifesto || "No manifesto available."}"
                      </p>
                      <Button
                        onClick={() => castVoteMutation.mutate({ electionId: selectedElection.id, positionId: selectedElection.positions[0].id, candidateId: candidate.id })}
                        disabled={castVoteMutation.isPending}
                        className="w-full rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border-none font-bold text-xs"
                      >
                        {castVoteMutation.isPending ? "Casting..." : "Vote for this Candidate"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
