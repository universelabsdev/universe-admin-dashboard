import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../../../../lib/api-client";
import { useAdminService } from "../../../../services/admin.service";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { Input } from "../../../../components/ui/input";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/ui/avatar";
import { motion, AnimatePresence } from "motion/react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "../../../../components/ui/dialog";
import { Textarea } from "../../../../components/ui/textarea";
import { cn } from "../../../../lib/utils";

export default function ModerationHub() {
  const queryClient = useQueryClient();
  const api = useApiClient();
  const adminService = useAdminService(api);
  
  const [activeTab, setActiveTab] = useState("queue");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT" | "RESOLVE" | "DISMISS" | null>(null);
  const [reason, setReason] = useState("");

  // Queries
  const { data: queueData, isLoading: loadingQueue } = useQuery({
    queryKey: ['admin', 'moderation', 'queue'],
    queryFn: () => adminService.getModerationQueue({ status: 'PENDING' }),
  });

  const { data: reportsData, isLoading: loadingReports } = useQuery({
    queryKey: ['admin', 'moderation', 'reports'],
    queryFn: () => adminService.getReports({ status: 'PENDING' }),
  });

  // Mutations
  const moderateMutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: string, action: 'APPROVE' | 'REJECT', reason?: string }) =>
      adminService.moderateContent(id, action, reason),
    onSuccess: (_, variables) => {
      toast.success(`Content ${variables.action.toLowerCase()}ed`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'moderation'] });
      setSelectedItem(null);
      setReviewAction(null);
      setReason("");
    },
    onError: (err: any) => toast.error("Action failed: " + err.message)
  });

  const resolveReportMutation = useMutation({
    mutationFn: ({ id, action, resolution }: { id: string, action: 'RESOLVE' | 'DISMISS', resolution: string }) =>
      adminService.resolveReport(id, action, resolution),
    onSuccess: (_, variables) => {
      toast.success(`Report ${variables.action.toLowerCase()}d`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'moderation'] });
      setSelectedItem(null);
      setReviewAction(null);
      setReason("");
    },
    onError: (err: any) => toast.error("Action failed: " + err.message)
  });

  const handleAction = () => {
    if (!selectedItem || !reviewAction) return;

    if (activeTab === "queue") {
      moderateMutation.mutate({ 
        id: selectedItem.id, 
        action: reviewAction as 'APPROVE' | 'REJECT', 
        reason 
      });
    } else {
      resolveReportMutation.mutate({ 
        id: selectedItem.id, 
        action: reviewAction as 'RESOLVE' | 'DISMISS', 
        resolution: reason 
      });
    }
  };

  const queue = queueData?.data?.items || [];
  const reports = reportsData?.data?.items || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading">Safety & Moderation</h2>
          <p className="text-muted-foreground mt-1">Protect the community by reviewing flagged content and user reports.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 px-4 py-1.5 rounded-full font-bold">
            <span className="material-symbols-rounded mr-2 text-[18px]">gpp_maybe</span>
            {queue.length + reports.length} Pending Tasks
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <TabsList className="bg-muted/50 p-1 rounded-2xl h-12 border border-border">
            <TabsTrigger 
              value="queue" 
              className="rounded-xl px-6 data-[state=active]:bg-card data-[state=active]:shadow-sm font-bold"
            >
              Moderation Queue
              {queue.length > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground text-[10px] h-5 w-5 flex items-center justify-center rounded-full">
                  {queue.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="rounded-xl px-6 data-[state=active]:bg-card data-[state=active]:shadow-sm font-bold"
            >
              User Reports
              {reports.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-[10px] h-5 w-5 flex items-center justify-center rounded-full">
                  {reports.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-muted-foreground">search</span>
              <Input
                placeholder="Search..."
                className="pl-10 bg-card border-border rounded-full h-10 focus-visible:ring-primary/20"
              />
            </div>
            <Button variant="outline" size="icon" className="rounded-full bg-card border-border">
              <span className="material-symbols-rounded">filter_list</span>
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <TabsContent value="queue" className="mt-0 focus-visible:ring-0">
            {loadingQueue ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : queue.length === 0 ? (
              <EmptyState icon="done_all" title="Queue is clear!" description="All content has been reviewed. Great job!" />
            ) : (
              <div className="grid gap-4">
                {queue.map((item: any) => (
                  <ModerationCard 
                    key={item.id} 
                    item={item} 
                    onReview={(action) => { setSelectedItem(item); setReviewAction(action); }} 
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports" className="mt-0 focus-visible:ring-0">
            {loadingReports ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin h-10 w-10 border-4 border-red-500 border-t-transparent rounded-full" />
              </div>
            ) : reports.length === 0 ? (
              <EmptyState icon="verified_user" title="No reports" description="The campus is quiet today. No pending user reports." />
            ) : (
              <div className="grid gap-4">
                {reports.map((report: any) => (
                  <ReportCard 
                    key={report.id} 
                    report={report} 
                    onReview={(action) => { setSelectedItem(report); setReviewAction(action); }} 
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </AnimatePresence>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={!!reviewAction} onOpenChange={(o) => !o && setReviewAction(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-card text-card-foreground">
          <DialogHeader className={cn(
            "p-8 text-white",
            reviewAction === "REJECT" || reviewAction === "RESOLVE" ? "bg-red-600" : "bg-emerald-600"
          )}>
            <DialogTitle className="text-2xl font-bold">
              {reviewAction === "APPROVE" && "Confirm Approval"}
              {reviewAction === "REJECT" && "Confirm Rejection"}
              {reviewAction === "RESOLVE" && "Resolve Report"}
              {reviewAction === "DISMISS" && "Dismiss Report"}
            </DialogTitle>
            <DialogDescription className="text-white/80 font-medium">
              Please provide a reason for this decision. This may be shared with the content author.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-8 space-y-4 bg-card">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground ml-1">Decision Note</label>
              <Textarea 
                placeholder="Type your reason here..."
                className="min-h-[120px] rounded-2xl border-border bg-muted/30 p-4 focus:bg-background transition-all"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="p-8 bg-muted/30 border-t border-border gap-3">
            <Button variant="ghost" onClick={() => setReviewAction(null)} className="rounded-full px-6 font-bold">Cancel</Button>
            <Button 
              className={cn(
                "rounded-full px-8 font-black shadow-lg transition-all hover:scale-[1.02]",
                reviewAction === "REJECT" || reviewAction === "RESOLVE" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
              )}
              onClick={handleAction}
              disabled={moderateMutation.isPending || resolveReportMutation.isPending}
            >
              Confirm Decision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ModerationCard({ item, onReview }: { item: any, onReview: (a: any) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="premium-card overflow-hidden border-border bg-card group">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-border">
                    <AvatarImage src={item.author?.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{item.author?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-black text-foreground">@{item.author?.name || "Unknown"}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0 h-5 rounded-full uppercase tracking-tighter">
                        {item.contentType}
                      </Badge>
                      <span className="text-[10px] font-medium text-muted-foreground flex items-center">
                        <span className="material-symbols-rounded text-[12px] mr-1">schedule</span>
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge className={cn(
                  "rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest",
                  item.priority === 'HIGH' || item.priority === 'URGENT' ? "bg-red-500 text-white" : "bg-blue-500 text-white"
                )}>
                  {item.priority}
                </Badge>
              </div>

              <div className="p-5 bg-muted/30 rounded-3xl border border-border relative">
                <span className="material-symbols-rounded absolute top-4 right-4 text-muted-foreground/20 text-4xl">format_quote</span>
                <p className="text-sm text-foreground leading-relaxed italic pr-8">
                  "{item.contentId === 'TEST' ? 'This is a sample flagged post content for demonstration.' : 'Sensitive content pending review...'}"
                </p>
                {item.autoFlagged && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.flagReasons?.map((reason: string) => (
                      <Badge key={reason} variant="outline" className="bg-red-500/5 border-red-500/20 text-red-500 text-[9px] font-bold rounded-full">
                        AI: {reason}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-2 min-w-[180px] justify-end border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
              <Button 
                onClick={() => onReview("APPROVE")}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold h-10 shadow-lg shadow-emerald-500/10"
              >
                <span className="material-symbols-rounded mr-2 text-[18px]">check_circle</span> Approve
              </Button>
              <Button 
                variant="destructive"
                onClick={() => onReview("REJECT")}
                className="flex-1 rounded-full font-bold h-10 shadow-lg shadow-red-500/10"
              >
                <span className="material-symbols-rounded mr-2 text-[18px]">block</span> Reject
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ReportCard({ report, onReview }: { report: any, onReview: (a: any) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="premium-card overflow-hidden border-border bg-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-black text-xs border border-red-500/20">
                    !
                  </div>
                  <p className="text-sm font-black text-foreground">Report #{report.id.slice(-4).toUpperCase()}</p>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded-full">
                    {report.reason?.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-[10px] font-medium text-muted-foreground">
                  {new Date(report.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/20 rounded-2xl border border-border">
                  <p className="text-[9px] font-black text-muted-foreground uppercase mb-2 tracking-widest">Reporter</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={report.reporter?.avatar} />
                      <AvatarFallback className="text-[8px] font-bold">{report.reporter?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-bold text-foreground">@{report.reporter?.name || "Reporter"}</span>
                  </div>
                </div>
                <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                  <p className="text-[9px] font-black text-red-500/60 uppercase mb-2 tracking-widest">Reported User</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 ring-1 ring-red-500/20">
                      <AvatarImage src={report.reportedUser?.avatar} />
                      <AvatarFallback className="text-[8px] font-bold bg-red-500 text-white">{report.reportedUser?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-bold text-red-600">@{report.reportedUser?.name || "Subject"}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-card rounded-2xl border border-border">
                <p className="text-[9px] font-black text-muted-foreground uppercase mb-2 tracking-widest">Incident Description</p>
                <p className="text-sm text-foreground leading-relaxed italic">
                  "{report.description}"
                </p>
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-2 min-w-[180px] justify-end border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
              <Button 
                onClick={() => onReview("RESOLVE")}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold h-10"
              >
                Take Action
              </Button>
              <Button 
                variant="outline"
                onClick={() => onReview("DISMISS")}
                className="flex-1 rounded-full border-border font-bold h-10 hover:bg-muted"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState({ icon, title, description }: { icon: string, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="h-20 w-20 rounded-[32px] bg-muted/50 flex items-center justify-center mb-2">
        <span className="material-symbols-rounded text-muted-foreground/30 text-5xl">{icon}</span>
      </div>
      <div>
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">{description}</p>
      </div>
    </div>
  );
}
