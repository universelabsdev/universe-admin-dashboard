import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { Switch } from "../../../../components/ui/switch";
import { useAdminService } from "../../../../services/admin.service";
import { useApiClient } from "../../../../lib/api-client";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/ui/avatar";
import { ScrollArea } from "../../../../components/ui/scroll-area";
import { Badge } from "../../../../components/ui/badge";
import { Card } from "../../../../components/ui/card";
import { DateTimePicker } from "../../../../components/ui/date-time-picker";
import { cn } from "../../../../lib/utils";

export function CreateElectionDialog({ onElectionCreated }: { onElectionCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const api = useApiClient();
  const adminService = useAdminService(api);

  const [metadata, setMetadata] = useState<any>({
    electionTypes: [],
    organizationTypes: [],
  });

  const [formData, setForm] = useState({
    title: "",
    description: "",
    electionType: "",
    organizationType: "UNIVERSITY",
    organizationId: "",
    votingStartDate: "",
    votingEndDate: "",
    coverImage: "",
    isAnonymous: true,
    requiresVerification: true,
    branchId: "",
    allowMultipleChoices: false,
    maxChoices: 1,
  });

  const [candidates, setCandidates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await adminService.uploadMedia(file);
      const url = res.data?.url || (res as any).url;
      if (url) {
        setForm(prev => ({ ...prev, coverImage: url }));
        toast.success("Banner image uploaded!");
      }
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (open) {
      // Fetch all required configuration data from backend
      setLoading(true);
      Promise.all([
        adminService.getBranches().catch(e => ({ data: [] })),
        adminService.getMetadata().catch(e => ({ data: null }))
      ]).then(([branchesRes, metaRes]) => {
        // Handle different response shapes from backend
        const branchData = branchesRes.data || (branchesRes as any).branches || branchesRes || [];
        const metaData = metaRes.data || metaRes || null;
        
        console.log("[CreateElection] Branches fetched:", branchData);
        console.log("[CreateElection] Metadata fetched:", metaData);

        setBranches(Array.isArray(branchData) ? branchData : []);
        
        const safeMeta = {
          electionTypes: Array.isArray(metaData?.electionTypes) ? metaData.electionTypes : [],
          organizationTypes: Array.isArray(metaData?.organizationTypes) ? metaData.organizationTypes : [],
        };
        setMetadata(safeMeta);
        
        // Set defaults if not set
        if (!formData.electionType && safeMeta.electionTypes.length > 0) {
          setForm(prev => ({ ...prev, electionType: safeMeta.electionTypes[0] }));
        }
      }).catch(err => {
        console.error("Failed to fetch form metadata", err);
        toast.error("Failed to load form configuration");
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [open]);

  // Use effect for debounced search
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      
      setSearching(true);
      try {
        const res = await adminService.getUsers({ q: searchTerm, limit: 5 });
        const users = res.data || (res as any).users || (res as any).items || (Array.isArray(res) ? res : []);
        setSearchResults(Array.isArray(users) ? users : []);
      } catch (err) {
        console.error("Search failed", err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const addCandidate = (user: any) => {
    if (candidates.find(c => c.userId === user.id)) {
      toast.error("User already added as candidate");
      return;
    }
    setCandidates([...candidates, { 
      userId: user.id, 
      name: user.name || user.fullName || "Unknown User", 
      avatar: user.avatar || user.profilePicture || user.imageUrl,
      candidateType: "PERSON",
      manifesto: "",
      displayOrder: candidates.length
    }]);
    setSearchTerm("");
    setSearchResults([]);
  };

  const removeCandidate = (id: string) => {
    setCandidates(candidates.filter(c => c.userId !== id));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Election title is required");
      return;
    }
    if (!formData.electionType) {
      toast.error("Please select an election category");
      return;
    }
    if (!formData.votingStartDate || !formData.votingEndDate) {
      toast.error("Start and end dates are required");
      return;
    }
    const start = new Date(formData.votingStartDate);
    const end = new Date(formData.votingEndDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      toast.error("Invalid date format — please re-select dates");
      return;
    }
    if (end <= start) {
      toast.error("End date must be after start date");
      return;
    }

    setLoading(true);
    try {
      await adminService.createElection({
        ...formData,
        branchId: formData.branchId || undefined,
        organizationId: formData.organizationId || undefined,
        candidates: candidates.map((c, i) => ({
          userId: c.userId,
          candidateType: c.candidateType,
          // Store null instead of empty string for absent manifestos
          manifesto: c.manifesto?.trim() || undefined,
          displayOrder: i,
        })),
      });
      toast.success("Election created successfully!");
      setOpen(false);
      resetForm();
      onElectionCreated();
    } catch (err: any) {
      toast.error(`Creation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setCandidates([]);
    setForm({
      title: "",
      description: "",
      electionType: metadata.electionTypes?.[0] || "",
      organizationType: "UNIVERSITY",
      organizationId: "",
      votingStartDate: "",
      votingEndDate: "",
      coverImage: "",
      isAnonymous: true,
      requiresVerification: true,
      branchId: "",
      allowMultipleChoices: false,
      maxChoices: 1,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-white rounded-full shadow-md shadow-primary/20 h-11 px-6">
          <span className="material-symbols-rounded mr-2 text-[20px]">add</span> Create Election
        </Button>
      </DialogTrigger>
      {/* M3 Style: Large rounded corners, centered, scrollable if needed */}
      <DialogContent className="sm:max-w-[640px] p-0 overflow-hidden rounded-[28px] border-none shadow-2xl max-h-[92vh] flex flex-col bg-card text-card-foreground">
        <DialogHeader className="p-8 bg-slate-950 dark:bg-slate-900 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-bold tracking-tight">New Election</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">
                Step {step} of 2: {step === 1 ? "Configuration" : "Candidates"}
              </DialogDescription>
            </div>
            {/* M3 Style Stepper Dots */}
            <div className="flex gap-2">
              {[1, 2].map(i => (
                <div key={i} className={cn(
                  "h-2 w-2 rounded-full transition-all duration-300",
                  step === i ? "bg-primary w-6" : "bg-slate-800"
                )} />
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content Area to prevent overflow */}
        <ScrollArea className="flex-1 overflow-y-auto bg-card">
          <div className="p-8 pb-4">
            {step === 1 ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid gap-2">
                  <Label className="text-sm font-bold text-muted-foreground ml-1">Banner Image</Label>
                  <div 
                    className={cn(
                      "relative h-40 w-full rounded-[24px] border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center overflow-hidden transition-all group hover:border-primary/50 hover:bg-primary/5",
                      formData.coverImage && "border-solid border-primary/20"
                    )}
                  >
                    {formData.coverImage ? (
                      <>
                        <img src={formData.coverImage} className="w-full h-full object-cover" alt="Banner" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="rounded-full font-bold h-9"
                            onClick={() => document.getElementById('banner-upload')?.click()}
                          >
                            Change Image
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="rounded-full font-bold h-9"
                            onClick={() => setForm({...formData, coverImage: ""})}
                          >
                            Remove
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        {uploading ? (
                          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                        ) : (
                          <div className="text-center p-6 cursor-pointer" onClick={() => document.getElementById('banner-upload')?.click()}>
                            <div className="h-12 w-12 bg-card rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-3 border border-border">
                              <span className="material-symbols-rounded text-primary text-[28px]">add_photo_alternate</span>
                            </div>
                            <p className="text-sm font-bold text-foreground mb-1">Upload Election Banner</p>
                            <p className="text-[11px] text-muted-foreground font-medium italic">Recommended size: 1200x400 (PNG, JPG)</p>
                          </div>
                        )}
                      </>
                    )}
                    <input 
                      id="banner-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-sm font-bold text-muted-foreground ml-1">Election Title *</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g. Student Council President 2026" 
                    value={formData.title}
                    onChange={e => setForm({...formData, title: e.target.value})}
                    className="rounded-2xl border-input bg-background h-12 focus:ring-primary/20"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-sm font-bold text-muted-foreground ml-1">Election Category *</Label>
                    <NativeSelect 
                      value={formData.electionType} 
                      onValueChange={(v: string) => setForm({...formData, electionType: v})}
                      className="rounded-2xl h-12 bg-background border-input"
                    >
                      {metadata.electionTypes.map((type: string) => (
                        <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                      ))}
                    </NativeSelect>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm font-bold text-muted-foreground ml-1">Campus Branch</Label>
                    <NativeSelect 
                      value={formData.branchId} 
                      onValueChange={(v: string) => setForm({...formData, branchId: v})}
                      className="rounded-2xl h-12 bg-background border-input"
                    >
                      <option value="">All Branches</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </NativeSelect>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-sm font-bold text-muted-foreground ml-1">Organization Type</Label>
                    <NativeSelect 
                      value={formData.organizationType} 
                      onValueChange={(v: string) => setForm({...formData, organizationType: v})}
                      className="rounded-2xl h-12 bg-background border-input"
                    >
                      {metadata.organizationTypes.map((type: string) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </NativeSelect>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm font-bold text-muted-foreground ml-1">Org ID (Optional)</Label>
                    <Input 
                      placeholder="e.g. club_id or dept_id" 
                      value={formData.organizationId}
                      onChange={e => setForm({...formData, organizationId: e.target.value})}
                      className="rounded-2xl border-input bg-background h-12"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <DateTimePicker 
                    label="Start Date *"
                    date={formData.votingStartDate}
                    onChange={val => setForm({...formData, votingStartDate: val})}
                    placeholder="Set start time"
                  />
                  <DateTimePicker 
                    label="End Date *"
                    date={formData.votingEndDate}
                    onChange={val => setForm({...formData, votingEndDate: val})}
                    placeholder="Set end time"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="desc" className="text-sm font-bold text-muted-foreground ml-1">Description</Label>
                  <Textarea 
                    id="desc" 
                    placeholder="Provide details about the election objectives and rules..." 
                    className="min-h-[100px] rounded-2xl border-input bg-background p-4"
                    value={formData.description}
                    onChange={e => setForm({...formData, description: e.target.value})}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-[20px] border border-border transition-colors hover:bg-muted">
                    <div className="space-y-0.5">
                      <Label className="font-bold flex items-center text-foreground">
                        <span className="material-symbols-rounded text-primary mr-2 text-[18px]">lock</span>
                        Anonymous Voting
                      </Label>
                      <p className="text-[11px] text-muted-foreground font-medium">Voter identities are encrypted and hidden from results</p>
                    </div>
                    <Switch 
                      checked={formData.isAnonymous} 
                      onCheckedChange={v => setForm({...formData, isAnonymous: v})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-[20px] border border-border transition-colors hover:bg-muted">
                    <div className="space-y-0.5">
                      <Label className="font-bold flex items-center text-foreground">
                        <span className="material-symbols-rounded text-primary mr-2 text-[18px]">verified</span>
                        Strict Verification
                      </Label>
                      <p className="text-[11px] text-muted-foreground font-medium">Require Digital ID verification before casting votes</p>
                    </div>
                    <Switch 
                      checked={formData.requiresVerification} 
                      onCheckedChange={v => setForm({...formData, requiresVerification: v})}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="relative">
                  <Label className="text-sm font-bold text-muted-foreground mb-3 block ml-1 uppercase tracking-wider">Add Contestants</Label>
                  <div className="relative group">
                    <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">person_search</span>
                    <Input
                      placeholder="Search students by name, email or ID..."
                      className="pl-12 rounded-2xl border-input bg-background h-14 shadow-sm focus:ring-primary/10 transition-all"
                      value={searchTerm}
                      onChange={e => { setSearchTerm(e.target.value); setShowSearchResults(true); }}
                      onFocus={() => setShowSearchResults(true)}
                      onBlur={() => setTimeout(() => setShowSearchResults(false), 150)}
                    />
                    {searching && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent animate-spin rounded-full" />
                      </div>
                    )}
                  </div>

                  {showSearchResults && searchResults.length > 0 && (
                    <Card className="absolute top-full left-0 right-0 z-50 mt-2 shadow-2xl border-border rounded-[28px] overflow-hidden bg-card/95 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
                        {searchResults.filter(user => !candidates.find(c => c.userId === user.id)).map(user => (
                          <div
                            key={user.id}
                            className="flex items-center gap-4 p-3 hover:bg-primary/10 rounded-[20px] cursor-pointer transition-all group/item"
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => { addCandidate(user); setShowSearchResults(false); }}
                          >
                            <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm transition-transform group-hover/item:scale-105">
                              <AvatarImage src={user.avatar || user.profilePicture || user.imageUrl} />
                              <AvatarFallback className="bg-primary/10 text-primary font-bold">{(user?.name || user?.fullName || "U").charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-foreground truncate">{user?.name || user?.fullName || "Unknown User"}</p>
                              <p className="text-[11px] text-muted-foreground font-medium truncate">{user?.email || "No email"}</p>
                            </div>
                            <div className="opacity-0 group-hover/item:opacity-100 transition-opacity pr-2">
                               <span className="material-symbols-rounded text-primary text-[24px]">add_circle</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Contestants ({candidates.length})</Label>
                    {candidates.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setCandidates([])}
                        className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-full"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3 min-h-[120px]">
                    {candidates.map((c, idx) => (
                      <Card key={c.userId} className="p-4 border-border bg-card rounded-[24px] shadow-sm hover:shadow-md transition-all animate-in zoom-in-95 duration-200">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12 rounded-2xl border-2 border-border shadow-sm shrink-0">
                            <AvatarImage src={c.avatar} />
                            <AvatarFallback className="rounded-2xl font-bold bg-muted text-muted-foreground">{c.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-3 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-foreground text-base truncate">{c.name}</p>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors shrink-0"
                                onClick={() => removeCandidate(c.userId)}
                              >
                                <span className="material-symbols-rounded text-[20px]">delete</span>
                              </Button>
                            </div>
                            <div className="relative">
                              <Textarea 
                                placeholder="Candidate manifesto (required for public display)..." 
                                className="text-sm min-h-[70px] bg-muted/50 border-none rounded-2xl p-4 focus:bg-background focus:ring-2 focus:ring-primary/10 transition-all resize-none text-foreground"
                                value={c.manifesto}
                                onChange={e => {
                                  const newC = [...candidates];
                                  newC[idx].manifesto = e.target.value;
                                  setCandidates(newC);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {candidates.length === 0 && (
                      <div className="py-12 text-center border-2 border-dashed border-border rounded-[32px] bg-muted/20">
                        <span className="material-symbols-rounded text-muted-foreground/30 text-4xl mb-2">groups</span>
                        <p className="text-muted-foreground text-sm font-medium italic">No candidates added to this contest yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-8 bg-muted/30 border-t border-border shrink-0">
          <div className="flex w-full justify-between items-center gap-4">
            {step === 2 && (
              <Button 
                variant="ghost" 
                onClick={() => setStep(1)} 
                className="rounded-full px-6 font-bold text-muted-foreground hover:bg-muted"
              >
                <span className="material-symbols-rounded mr-2">arrow_back</span> Back
              </Button>
            )}
            <div className="flex-1" />
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)} 
              className="rounded-full px-8 border-border bg-background font-bold text-muted-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            {step === 1 ? (
              <Button
                onClick={() => {
                  if (!formData.title.trim()) { toast.error("Election title is required"); return; }
                  if (!formData.electionType) { toast.error("Please select an election category"); return; }
                  if (!formData.votingStartDate || !formData.votingEndDate) { toast.error("Start and end dates are required"); return; }
                  const s = new Date(formData.votingStartDate), e = new Date(formData.votingEndDate);
                  if (isNaN(s.getTime()) || isNaN(e.getTime())) { toast.error("Invalid date — please re-select"); return; }
                  if (e <= s) { toast.error("End date must be after start date"); return; }
                  setStep(2);
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-10 h-12 font-bold shadow-lg shadow-primary/20"
              >
                Continue <span className="material-symbols-rounded ml-2 text-[20px]">arrow_forward</span>
              </Button>
            ) : (
              <Button
                disabled={loading}
                onClick={handleSubmit}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-10 h-12 font-black shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center">
                    <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent animate-spin rounded-full mr-2" />
                    Launching...
                  </span>
                ) : (
                  <>Launch Election</>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
