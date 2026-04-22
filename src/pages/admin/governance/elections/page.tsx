import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../../../../lib/api-client";
import { useAdminService } from "../../../../services/admin.service";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Progress } from "../../../../components/ui/progress";
import { Badge } from "../../../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { toast } from "sonner";
import { CreateElectionDialog } from "./CreateElectionDialog";

export default function ElectionCenterPage() {
  const queryClient = useQueryClient();
  const api = useApiClient();
  const adminService = useAdminService(api);

  const [activeElectionId, setActiveElectionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [addCandidateOpen, setAddCandidateOpen] = useState(false);
  const [newCandidateName, setNewCandidateName] = useState("");
  const [newCandidateManifesto, setNewCandidateManifesto] = useState("");

  const { data: elections = [], isLoading: loadingElections } = useQuery({
    queryKey: ['admin', 'elections'],
    queryFn: async () => {
      const res = await adminService.getElections({ status: 'all', limit: 50 });
      return res.data?.elections || (res as any).elections || res.data || [];
    },
    staleTime: 30000,
  });

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['admin', 'elections', 'analytics'],
    queryFn: async () => {
      const res = await adminService.getElectionAnalytics().catch(() => ({ data: null }));
      return res.data;
    },
    staleTime: 60000,
  });

  const activeElection = elections.find((e: any) => e.id === activeElectionId) || elections[0] || null;

  const { data: activeResults } = useQuery({
    queryKey: ['admin', 'elections', 'results', activeElection?.id],
    queryFn: async () => {
      if (!activeElection?.id) return null;
      const res = await adminService.getElectionResults(activeElection.id);
      return res.data;
    },
    enabled: !!activeElection?.id && (['ACTIVE', 'PAST', 'COMPLETED', 'CLOSED'].includes(activeElection.status)),
  });

  const { data: candidatesList = [], refetch: refetchCandidates } = useQuery({
    queryKey: ['admin', 'elections', 'candidates', activeElection?.id],
    queryFn: async () => {
      if (!activeElection?.id) return [];
      const res = await adminService.getCandidates(activeElection.id);
      return res.data || [];
    },
    enabled: !!activeElection?.id,
  });

  useEffect(() => {
    if (!activeElectionId && elections.length > 0) {
      const featured = elections.find((e: any) => e.status === 'ACTIVE') || elections[0];
      if (featured) setActiveElectionId(featured.id);
    }
  }, [elections, activeElectionId]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminService.updateElectionStatus(id, status),
    onSuccess: (_, variables) => {
      toast.success(`Election is now ${variables.status.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'elections'] });
    },
    onError: (err: any) => toast.error("Failed to update status: " + err.message),
  });

  const addCandidateMutation = useMutation({
    mutationFn: ({ electionId, data }: { electionId: string; data: any }) =>
      adminService.addCandidate(electionId, data),
    onSuccess: () => {
      toast.success("Candidate added successfully");
      setAddCandidateOpen(false);
      setNewCandidateName("");
      setNewCandidateManifesto("");
      refetchCandidates();
      queryClient.invalidateQueries({ queryKey: ['admin', 'elections', 'candidates', activeElection?.id] });
    },
    onError: (err: any) => toast.error("Failed to add candidate: " + err.message),
  });

  const removeCandidateMutation = useMutation({
    mutationFn: ({ electionId, candidateId }: { electionId: string; candidateId: string }) =>
      adminService.removeCandidate(electionId, candidateId),
    onSuccess: () => {
      toast.success("Candidate removed");
      refetchCandidates();
      queryClient.invalidateQueries({ queryKey: ['admin', 'elections', 'candidates', activeElection?.id] });
    },
    onError: (err: any) => toast.error("Failed to remove candidate: " + err.message),
  });

  const handleAddCandidate = () => {
    if (!activeElection?.id || !newCandidateName.trim()) {
      toast.error("Candidate name is required");
      return;
    }
    addCandidateMutation.mutate({
      electionId: activeElection.id,
      data: {
        candidateType: 'PERSON',
        optionText: newCandidateName.trim(),
        manifesto: newCandidateManifesto.trim() || undefined,
      },
    });
  };

  const testElectionApi = async () => {
    try {
      const res = await api.get<{ elections: any[]; total: number }>('/elections', { params: { status: 'all' } });
      const electionsList = (res as any).data?.elections ?? (res as any).elections ?? res.data;
      if (Array.isArray(electionsList)) {
        toast.success(`Election API connected! Found ${electionsList.length} elections.`);
      } else {
        toast.warning("API connected but didn't return an array of elections.");
      }
    } catch (err: any) {
      toast.error(`API Error: ${err.message}`);
    }
  };

  if (loadingElections && elections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground font-medium">Loading Election Data...</p>
      </div>
    );
  }

  // Candidates come from the dedicated /candidates endpoint (live), falling back to embedded positions data
  const currentCandidates: any[] = candidatesList.length > 0
    ? candidatesList
    : (activeElection?.positions?.[0]?.candidates || []);

  const resultsData = activeResults || activeElection?.results;

  // The mapper returns startDate/endDate
  const startDate = activeElection?.startDate || activeElection?.votingStartDate;
  const endDate = activeElection?.endDate || activeElection?.votingEndDate;
  const eligibleVoters = resultsData?.eligibleVoters ?? activeElection?.eligibleVoters ?? null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading">Election Center</h2>
          <p className="text-muted-foreground mt-1">Manage student government and guild elections securely.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={testElectionApi} className="bg-amber-50 dark:bg-amber-500/10 rounded-full border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors">
            <span className="material-symbols-rounded mr-2 text-[18px]">bug_report</span> Test API
          </Button>
          <Button variant="outline" className="bg-background rounded-full shadow-sm border-border hover:bg-muted transition-colors">
            <span className="material-symbols-rounded mr-2 text-[18px] text-emerald-500">verified_user</span> Audit Logs
          </Button>
          <CreateElectionDialog onElectionCreated={() => queryClient.invalidateQueries({ queryKey: ['admin', 'elections'] })} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main Panel */}
        <div className="lg:col-span-8 space-y-6">
          {activeElection ? (
            <Card className="premium-card border-none overflow-hidden rounded-3xl shadow-xl bg-card text-card-foreground">
              {/* Banner Image */}
              <div className="h-48 md:h-64 w-full relative">
                <img
                  src={activeElection.coverImage || "https://images.unsplash.com/photo-1540910419892-f3174207baec?q=80&w=2070&auto=format&fit=crop"}
                  alt={activeElection.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={`rounded-full px-3 py-1 font-bold tracking-wider text-[10px] ${
                      activeElection.status === 'ACTIVE' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                      activeElection.status === 'UPCOMING' || activeElection.status === 'DRAFT' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-500/50 text-white'
                    }`}>
                      {activeElection.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse inline-block" />}
                      {activeElection.status}
                    </Badge>
                    <Badge variant="outline" className="bg-white/10 backdrop-blur-md border-white/20 text-white rounded-full px-3 py-1 font-bold tracking-wider text-[10px] uppercase">
                      {activeElection.category?.replace('_', ' ')}
                    </Badge>
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tight font-heading leading-tight">{activeElection.title}</h3>
                </div>

                {/* Quick Actions Overlay */}
                <div className="absolute top-6 right-6 flex gap-2">
                  {(activeElection.status === 'UPCOMING' || activeElection.status === 'DRAFT') && (
                    <Button
                      onClick={() => updateStatusMutation.mutate({ id: activeElection.id, status: 'ACTIVE' })}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-full h-10 px-6 font-bold shadow-lg shadow-emerald-500/20"
                    >
                      Activate Now
                    </Button>
                  )}
                  {activeElection.status === 'ACTIVE' && (
                    <Button
                      onClick={() => updateStatusMutation.mutate({ id: activeElection.id, status: 'CLOSED' })}
                      className="bg-amber-500 hover:bg-amber-600 text-white border-none rounded-full h-10 px-6 font-bold shadow-lg shadow-amber-500/20"
                    >
                      Close Polls
                    </Button>
                  )}
                  {activeElection.status === 'CLOSED' && (
                    <Button
                      onClick={() => updateStatusMutation.mutate({ id: activeElection.id, status: 'COMPLETED' })}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground border-none rounded-full h-10 px-6 font-bold shadow-lg shadow-primary/20"
                    >
                      Publish Results
                    </Button>
                  )}
                </div>
              </div>

              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="border-b border-border bg-muted/30 px-6">
                    <TabsList className="bg-transparent border-0 h-14 p-0 gap-6">
                      <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14 font-bold text-muted-foreground">Overview</TabsTrigger>
                      <TabsTrigger value="candidates" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14 font-bold text-muted-foreground">Candidates ({currentCandidates.length})</TabsTrigger>
                      <TabsTrigger value="results" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14 font-bold text-muted-foreground">Analytics</TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="p-6">
                    {/* Overview Tab */}
                    <TabsContent value="overview" className="mt-0 space-y-6">
                      <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1 space-y-4">
                          <h4 className="text-lg font-bold text-foreground">About this Election</h4>
                          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                            {activeElection.description || "No detailed description provided for this election."}
                          </p>
                          <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="bg-muted/50 p-4 rounded-2xl border border-border">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Voting Mechanism</p>
                              <p className="text-sm font-bold text-foreground capitalize">
                                {activeElection.positions?.[0]?.mechanism || "Single Selection"}
                              </p>
                            </div>
                            <div className="bg-muted/50 p-4 rounded-2xl border border-border">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Anonymity</p>
                              <p className="text-sm font-bold text-foreground">
                                {activeElection.isAnonymous !== false ? "Encrypted & Anonymous" : "Public Record"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="w-full md:w-72 space-y-4">
                          <Card className="bg-muted/50 border-none rounded-2xl p-4 shadow-sm">
                            <h5 className="font-bold text-foreground mb-4 flex items-center">
                              <span className="material-symbols-rounded text-primary mr-2 text-[20px]">schedule</span> Timeline
                            </h5>
                            <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
                              <div className="relative pl-8">
                                <div className="absolute left-0 top-1 h-[24px] w-[24px] rounded-full bg-background border-4 border-emerald-500 z-10" />
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Starts</p>
                                <p className="text-sm font-bold text-foreground">
                                  {startDate ? new Date(startDate).toLocaleString() : "N/A"}
                                </p>
                              </div>
                              <div className="relative pl-8">
                                <div className="absolute left-0 top-1 h-[24px] w-[24px] rounded-full bg-background border-4 border-primary z-10" />
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Ends</p>
                                <p className="text-sm font-bold text-foreground">
                                  {endDate ? new Date(endDate).toLocaleString() : "N/A"}
                                </p>
                              </div>
                            </div>
                          </Card>

                          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                            <p className="text-xs font-medium text-primary mb-2 flex items-center">
                              <span className="material-symbols-rounded text-[16px] mr-1.5">info</span> Eligibility Info
                            </p>
                            <p className="text-xs text-muted-foreground font-medium">
                              This election is restricted to {activeElection.category} members. Verification is {activeElection.requiresVerification !== false ? "required" : "optional"}.
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Candidates Tab */}
                    <TabsContent value="candidates" className="mt-0 space-y-4">
                      {/* Add candidate inline form */}
                      {addCandidateOpen ? (
                        <div className="bg-muted/40 rounded-2xl border border-border p-4 space-y-3">
                          <h5 className="font-bold text-foreground text-sm">Add New Candidate</h5>
                          <input
                            type="text"
                            placeholder="Candidate name or option text"
                            value={newCandidateName}
                            onChange={e => setNewCandidateName(e.target.value)}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          <textarea
                            placeholder="Manifesto / campaign statement (optional)"
                            value={newCandidateManifesto}
                            onChange={e => setNewCandidateManifesto(e.target.value)}
                            rows={2}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleAddCandidate}
                              disabled={addCandidateMutation.isPending}
                              className="rounded-full bg-primary text-primary-foreground font-bold px-5"
                            >
                              {addCandidateMutation.isPending ? "Adding..." : "Add Candidate"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setAddCandidateOpen(false); setNewCandidateName(""); setNewCandidateManifesto(""); }}
                              className="rounded-full font-bold"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAddCandidateOpen(true)}
                          className="rounded-full border-dashed border-primary/40 text-primary hover:bg-primary/5 font-bold"
                        >
                          <span className="material-symbols-rounded text-[16px] mr-1.5">person_add</span> Add Candidate
                        </Button>
                      )}

                      <div className="grid gap-4 sm:grid-cols-2">
                        {currentCandidates.map((candidate: any) => (
                          <div key={candidate.id} className="group flex flex-col p-4 bg-card border border-border rounded-3xl hover:shadow-lg hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-4 mb-3">
                              <div className="h-14 w-14 rounded-2xl overflow-hidden bg-muted border border-border shrink-0">
                                {candidate.photo || candidate.imageUrl ? (
                                  <img src={candidate.photo || candidate.imageUrl} alt={candidate.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold text-xl uppercase">
                                    {(candidate.name || candidate.optionText)?.charAt(0) || "?"}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                  {candidate.name || candidate.optionText || "Unknown"}
                                </h5>
                                <Badge variant="secondary" className="mt-1 bg-muted text-muted-foreground text-[10px] font-bold uppercase rounded-full">
                                  {candidate.status || "Approved"}
                                </Badge>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeCandidateMutation.mutate({ electionId: activeElection.id, candidateId: candidate.id })}
                                disabled={removeCandidateMutation.isPending}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                title="Remove candidate"
                              >
                                <span className="material-symbols-rounded text-[18px]">delete</span>
                              </button>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed italic">
                              "{candidate.manifesto || "No manifesto submitted yet."}"
                            </p>
                          </div>
                        ))}
                        {currentCandidates.length === 0 && (
                          <div className="col-span-full py-20 text-center">
                            <span className="material-symbols-rounded text-5xl text-muted/30 mb-4 block">person_search</span>
                            <p className="text-muted-foreground font-medium italic">No candidates registered for this position yet.</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Analytics Tab */}
                    <TabsContent value="results" className="mt-0">
                      <div className="space-y-6">
                        <div className="bg-muted/30 rounded-3xl p-6 border border-border">
                          <div className="flex justify-between items-end mb-6">
                            <div>
                              <div className="text-sm font-bold text-muted-foreground mb-2 flex items-center uppercase tracking-widest">
                                <span className="material-symbols-rounded text-[18px] mr-2 text-primary">analytics</span>
                                Voter Participation
                              </div>
                              <div className="text-5xl font-black text-foreground tracking-tight">
                                {resultsData?.totalVotes ?? activeElection?.totalVotes ?? 0}
                                {eligibleVoters != null && (
                                  <span className="text-xl text-muted-foreground font-bold ml-2 italic">
                                    / {eligibleVoters.toLocaleString()} eligible
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-4xl font-black text-emerald-500">
                                {resultsData?.turnout ? `${resultsData.turnout}%` : '0%'}
                              </div>
                            </div>
                          </div>
                          <Progress value={resultsData?.turnout || 0} className="h-4 bg-muted rounded-full [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-emerald-500" />
                        </div>

                        {/* Per-candidate results */}
                        {resultsData?.positions?.[0]?.results?.length > 0 && (
                          <div className="space-y-3">
                            <h5 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Results Breakdown</h5>
                            {resultsData.positions[0].results.map((r: any, i: number) => {
                              const total = resultsData.totalVotes || 1;
                              const pct = Math.round((r.votes / total) * 100);
                              return (
                                <div key={r.candidateId || i} className="flex items-center gap-4">
                                  <div className="w-32 text-sm font-bold text-foreground truncate">{r.candidateName || r.candidateId}</div>
                                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full transition-all duration-700 bar-fill-dynamic" style={{ "--bar-pct": `${pct}%` } as React.CSSProperties} />
                                  </div>
                                  <div className="w-20 text-right text-sm font-black text-foreground">{r.votes} <span className="text-muted-foreground font-normal">({pct}%)</span></div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="grid gap-6 md:grid-cols-2">
                          <Card className="border border-border bg-card rounded-3xl shadow-sm">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Security Audit</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground font-medium">Verified ID Logins</span>
                                  <span className="font-bold text-foreground">100%</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground font-medium">Duplicate Attempts</span>
                                  <span className="font-bold text-destructive">0</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground font-medium">Encryption Status</span>
                                  <span className="font-bold text-emerald-500 flex items-center">
                                    <span className="material-symbols-rounded text-[16px] mr-1">lock</span> Active
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="border border-border bg-card rounded-3xl shadow-sm">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Leaderboard Preview</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-xs text-muted-foreground italic">Detailed per-candidate result breakdown is available after the election ends or via the "Live Results" view for admins.</p>
                              <Button variant="link" className="text-primary p-0 h-auto mt-4 font-bold">Open Full Real-time Analytics &rarr;</Button>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="premium-card border-dashed border-2 flex items-center justify-center p-20 bg-muted/20 rounded-3xl border-border">
              <div className="text-center">
                <span className="material-symbols-rounded text-6xl text-muted-foreground/30 mb-6 block">how_to_vote</span>
                <p className="text-muted-foreground font-bold text-lg">No elections found in your jurisdiction</p>
                <CreateElectionDialog onElectionCreated={() => queryClient.invalidateQueries({ queryKey: ['admin', 'elections'] })} />
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar Panel */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="premium-card border-none flex flex-col rounded-3xl overflow-hidden shadow-lg h-full max-h-[800px] bg-card text-card-foreground">
            <CardHeader className="border-b border-border pb-4 bg-muted/30">
              <CardTitle className="text-lg font-black text-foreground flex items-center justify-between tracking-tight">
                Elections Registry
                <Badge variant="secondary" className="rounded-full font-black bg-background border border-border shadow-sm">{elections.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto scrollbar-hide">
              <div className="divide-y divide-border h-full">
                {elections.map((election: any) => {
                  const elStartDate = election.startDate || election.votingStartDate;
                  return (
                    <div
                      key={election.id}
                      className={`p-5 hover:bg-muted/50 transition-all group cursor-pointer border-l-4 ${activeElectionId === election.id ? 'bg-primary/5 border-primary shadow-inner' : 'border-transparent'}`}
                      onClick={() => { setActiveElectionId(election.id); setActiveTab("overview"); }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`font-black tracking-tight leading-tight transition-colors ${activeElectionId === election.id ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>
                          {election.title}
                        </span>
                        <Badge className={`text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full ${
                          election.status === 'ACTIVE' ? 'bg-emerald-500 text-white' :
                          election.status === 'UPCOMING' || election.status === 'DRAFT' ? 'bg-blue-500 text-white' :
                          election.status === 'CLOSED' ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'
                        }`}>
                          {election.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="text-[9px] uppercase font-bold border-border bg-background rounded-full">
                          {election.category?.replace('_', ' ')}
                        </Badge>
                        <div className="text-[10px] font-bold text-muted-foreground italic">
                          {elStartDate ? new Date(elStartDate).toLocaleDateString() : "N/A"}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {elections.length === 0 && (
                  <div className="p-20 text-center text-muted/30">
                    <span className="material-symbols-rounded text-4xl mb-2 opacity-20 block">inventory_2</span>
                    <p className="italic text-sm">No historical data found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card border-none bg-primary rounded-3xl shadow-xl shadow-primary/20 text-primary-foreground overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-black uppercase tracking-widest opacity-80 flex items-center justify-between w-full">
                Global Turnout
                {loadingAnalytics && <div className="h-3 w-3 border-2 border-white/30 border-t-white animate-spin rounded-full" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black mb-1">{analytics?.averageTurnout || "0"}%</div>
              <p className="text-xs font-medium opacity-70 mb-4">Average across all 2026 academic sessions</p>
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000 bar-fill-dynamic-white" style={{ "--bar-pct": `${analytics?.averageTurnout || 0}%` } as React.CSSProperties} />
              </div>
              <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white rounded-full font-bold text-xs h-9">
                Download Global Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
