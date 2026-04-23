import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useUser as useClerkUser } from "@clerk/clerk-react";
import { useUser } from "@/hooks/useUser";
import { useApiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Trash2, 
  ChevronRight,
  Camera,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { user: clerkUser } = useClerkUser();
  const { user: backendUser, loading: userLoading } = useUser();
  const api = useApiClient();
  const queryClient = useQueryClient();
  
  const [activeSection, setActiveSection] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
  });

  useEffect(() => {
    if (backendUser) {
      setFormData({
        name: backendUser.name || "",
        username: backendUser.username || "",
        bio: backendUser.bio || "",
      });
    } else if (clerkUser) {
      setFormData({
        name: clerkUser.fullName || "",
        username: clerkUser.username || "",
        bio: "",
      });
    }
  }, [backendUser, clerkUser]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/users/me', formData);
      toast.success("Settings saved successfully!");
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast.error("File size must be less than 1MB");
      return;
    }

    const uploadData = new FormData();
    uploadData.append('avatar', file);
    setUploading(true);
    try {
      await api.post('/users/me/avatar', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success("Profile picture updated!");
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Loading preferences...</p>
      </div>
    );
  }

  const menuItems = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "danger", label: "Danger Zone", icon: Trash2, color: "text-red-500" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-foreground uppercase italic">Settings</h1>
        <p className="text-muted-foreground font-medium">Manage your identity and system preferences.</p>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <nav className="flex flex-row gap-2 overflow-x-auto pb-4 lg:flex-col lg:overflow-visible lg:pb-0">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all whitespace-nowrap ${
                  activeSection === item.id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-bold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground font-medium"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`h-4 w-4 ${item.color || ""}`} />
                  <span className="text-sm">{item.label}</span>
                </div>
                <ChevronRight className={`hidden lg:block h-3 w-3 transition-transform ${activeSection === item.id ? "rotate-90" : ""}`} />
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 max-w-2xl">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {activeSection === "profile" && (
              <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[32px]">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal details and public profile.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="flex flex-col sm:flex-row items-center gap-8">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-3xl bg-muted flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                        {(backendUser?.avatar || clerkUser?.imageUrl) ? (
                          <img src={backendUser?.avatar || clerkUser?.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-10 w-10 text-muted-foreground" />
                        )}
                      </div>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-xl shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                        disabled={uploading}
                      >
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      </button>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>
                    <div className="text-center sm:text-left space-y-1">
                      <h3 className="text-xl font-bold">{formData.name || "Anonymous User"}</h3>
                      <p className="text-sm text-muted-foreground">Recommended size: 400x400px (Max 1MB)</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                      <Input 
                        id="name" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        className="rounded-2xl h-12 bg-slate-50 border-slate-100 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Username</Label>
                      <Input 
                        id="username" 
                        value={formData.username} 
                        onChange={(e) => setFormData({...formData, username: e.target.value})} 
                        className="rounded-2xl h-12 bg-slate-50 border-slate-100 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Bio</Label>
                      <textarea 
                        id="bio" 
                        className="flex min-h-[120px] w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus:bg-white transition-all"
                        placeholder="Tell the UniVerse a little bit about yourself..."
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-8 pt-0">
                  <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="rounded-2xl h-12 px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 font-bold"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Profile Changes
                  </Button>
                </CardFooter>
              </Card>
            )}

            {activeSection === "security" && (
              <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[32px]">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                  <CardTitle>Security & Access</CardTitle>
                  <CardDescription>Manage your password and authentication methods.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="space-y-1">
                      <p className="text-sm font-bold">Two-Factor Authentication</p>
                      <p className="text-xs text-muted-foreground">Add an extra layer of security to your account.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="space-y-1">
                      <p className="text-sm font-bold">Session Management</p>
                      <p className="text-xs text-muted-foreground">Sign out of all other active sessions.</p>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl">Sign Out Everywhere</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "notifications" && (
              <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[32px]">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Stay updated with university activities.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                   <div className="space-y-4">
                     <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Platform Alerts</h4>
                     {[
                       { id: 'v1', label: 'University Announcements', desc: 'Critical system-wide updates' },
                       { id: 'v2', label: 'Security Notifications', desc: 'Login alerts and security audits' },
                       { id: 'v3', label: 'Electoral Alerts', desc: 'New polls and result broadcasts' }
                     ].map(item => (
                       <div key={item.id} className="flex items-center justify-between">
                         <div className="space-y-0.5">
                           <Label className="text-sm font-bold">{item.label}</Label>
                           <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                         </div>
                         <Switch defaultChecked />
                       </div>
                     ))}
                   </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "danger" && (
              <Card className="border-2 border-red-100 shadow-none bg-white overflow-hidden rounded-[32px]">
                <CardHeader className="bg-red-50/50 border-b border-red-100">
                  <CardTitle className="text-red-600">Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions related to your UniVerse account.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold">Delete Account</h4>
                      <p className="text-xs text-muted-foreground max-w-sm">This will permanently remove your student ID and all associated records from the UniVerse network.</p>
                    </div>
                    <Button variant="destructive" className="rounded-2xl h-12 px-8 font-black uppercase text-xs tracking-widest">
                      Terminate Identity
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
