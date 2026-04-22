import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const api = useApiClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get(`/users/${id}`);
        setUser(response.data || response);
      } catch (err) {
        toast.error("Failed to fetch user details");
        navigate("/admin/identity/directory");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, api, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <span className="material-symbols-rounded">arrow_back</span>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-heading">User Details</h2>
          <p className="text-slate-500">Managing {user.name || user.username}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 premium-card overflow-hidden h-fit">
          <div className="h-32 bg-primary/10 relative"></div>
          <CardContent className="relative pt-0 px-6 pb-6">
            <div className="flex flex-col items-center -mt-12 text-center">
              <div className="w-24 h-24 rounded-full border-4 border-background bg-muted flex items-center justify-center overflow-hidden shadow-sm">
                {user.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-rounded text-5xl text-muted-foreground">person</span>
                )}
              </div>
              <h3 className="mt-4 text-xl font-bold">{user.name || "Anonymous"}</h3>
              <p className="text-sm text-muted-foreground">@{user.username || "no-username"}</p>
              <Badge className="mt-2 rounded-full uppercase text-[10px]">{user.role}</Badge>
              
              <div className="w-full grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                <div className="text-center">
                  <p className="text-lg font-bold">{user.points || 0}</p>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Points</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{user._count?.posts || 0}</p>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Posts</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="font-medium">{user.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Department</p>
                  <p className="font-medium">{user.department?.name || "None"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Branch</p>
                  <p className="font-medium">{user.branch?.name || "None"}</p>
                </div>
              </div>
              
              <div className="space-y-1 pt-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bio</p>
                <p className="text-sm leading-relaxed">{user.bio || "No bio provided."}</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button className="flex-1 rounded-full bg-primary" onClick={() => navigate('/admin/identity/rbac')}>
              <span className="material-symbols-rounded mr-2">shield</span>
              Modify Access
            </Button>
            <Button variant="outline" className="flex-1 rounded-full text-destructive border-destructive hover:bg-destructive/10" onClick={() => toast.warning("Suspension coming soon")}>
              <span className="material-symbols-rounded mr-2">person_remove</span>
              {user.isActive ? 'Suspend User' : 'Activate User'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
