import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useUser as useClerkUser } from "@clerk/clerk-react";
import { useUser } from "@/hooks/useUser";
import { useApiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function SettingsPage() {
  const { user: clerkUser } = useClerkUser();
  const { user: backendUser, loading: userLoading } = useUser();
  const api = useApiClient();
  const queryClient = useQueryClient();
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

    // Basic validation
    if (file.size > 1024 * 1024) {
      toast.error("File size must be less than 1MB");
      return;
    }

    const uploadData = new FormData();
    uploadData.append('avatar', file);

    setUploading(true);
    try {
      await api.post('/users/me/avatar', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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
    return <div className="flex items-center justify-center min-h-[400px]">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold font-heading tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 space-x-6 mb-6">
          <TabsTrigger 
            value="account" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 font-medium"
          >
            Account
          </TabsTrigger>
          <TabsTrigger 
            value="privacy" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 font-medium"
          >
            Privacy
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 font-medium"
          >
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details and public profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border shadow-sm">
                  {(backendUser?.avatar || clerkUser?.imageUrl) ? (
                    <img src={backendUser?.avatar || clerkUser?.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-rounded text-3xl text-muted-foreground">person</span>
                  )}
                </div>
                <div className="space-y-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Change Avatar"}
                  </Button>
                  <p className="text-xs text-muted-foreground">JPG, GIF or PNG. 1MB max.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  value={formData.username} 
                  onChange={(e) => setFormData({...formData, username: e.target.value})} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea 
                  id="bio" 
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Tell us a little bit about yourself"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                />
              </div>

              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          <Card className="premium-card border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions related to your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Delete Account</h4>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all your data.</p>
                </div>
                <Button variant="destructive">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control who can see your profile and activity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Private Profile</Label>
                  <p className="text-sm text-muted-foreground">Only approved followers can see your posts and activity.</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Show Online Status</Label>
                  <p className="text-sm text-muted-foreground">Let others see when you are active on the platform.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Search Engine Visibility</Label>
                  <p className="text-sm text-muted-foreground">Allow search engines to index your public profile.</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what you want to be notified about.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Email Notifications</h4>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Mentions & Replies</Label>
                    <p className="text-sm text-muted-foreground">When someone mentions you or replies to your post.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">New Followers</Label>
                    <p className="text-sm text-muted-foreground">When someone starts following you.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">University Announcements</Label>
                    <p className="text-sm text-muted-foreground">Official communications from the university.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t border-border">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Push Notifications</h4>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Direct Messages</Label>
                    <p className="text-sm text-muted-foreground">When you receive a new direct message.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Event Reminders</Label>
                    <p className="text-sm text-muted-foreground">Reminders for events you're attending.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
