import React from "react";
import { useUser as useClerkUser } from "@clerk/clerk-react";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function UserProfilePage() {
  const { user: clerkUser } = useClerkUser();
  const { user: backendUser, loading } = useUser();

  // Combine data, preferring backend data for profile fields
  // Add a cache-busting timestamp to the avatar URL if it's from our backend
  const backendAvatar = backendUser?.avatar;
  const avatarUrl = backendAvatar 
    ? (backendAvatar.includes('?') ? `${backendAvatar}&t=${Date.now()}` : `${backendAvatar}?t=${Date.now()}`)
    : clerkUser?.imageUrl;

  const profile = {
    fullName: backendUser?.name || clerkUser?.fullName || "Anonymous User",
    email: backendUser?.email || clerkUser?.primaryEmailAddress?.emailAddress || "No email provided",
    avatar: avatarUrl,
    role: backendUser?.role || "STUDENT",
    bio: backendUser?.bio || "No bio provided.",
    branch: backendUser?.branch?.name || "Main Campus",
    joinedDate: backendUser?.createdAt || clerkUser?.createdAt,
    stats: {
      posts: backendUser?._count?.posts || 0,
      followers: backendUser?._count?.followers || 0,
      following: backendUser?._count?.following || 0,
      points: backendUser?.points || 0
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Loading profile...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      {/* Profile Header */}
      <Card className="premium-card overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-primary/20 to-primary/5 relative">
          <Button variant="secondary" size="sm" className="absolute top-4 right-4 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background">
            <span className="material-symbols-rounded mr-2 text-[18px]">edit</span>
            Edit Cover
          </Button>
        </div>
        <CardContent className="relative pt-0 pb-8 px-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16 mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-background bg-muted flex items-center justify-center overflow-hidden shadow-md">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-rounded text-6xl text-muted-foreground">person</span>
                )}
              </div>
              <Button size="icon" className="absolute bottom-0 right-0 rounded-full w-8 h-8 shadow-sm">
                <span className="material-symbols-rounded text-[16px]">photo_camera</span>
              </Button>
            </div>
            
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold font-heading tracking-tight">{profile.fullName}</h1>
                <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary hover:bg-primary/20 uppercase text-[10px]">{profile.role}</Badge>
              </div>
              <p className="text-muted-foreground text-lg">{profile.email}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
                <span className="flex items-center gap-1"><span className="material-symbols-rounded text-[16px]">location_on</span> {profile.branch}</span>
                <span className="flex items-center gap-1"><span className="material-symbols-rounded text-[16px]">calendar_month</span> Joined {profile.joinedDate ? new Date(profile.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}</span>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
              <Button className="flex-1 md:flex-none rounded-full px-6">
                <span className="material-symbols-rounded mr-2 text-[18px]">edit</span>
                Edit Profile
              </Button>
              <Button variant="outline" size="icon" className="rounded-full">
                <span className="material-symbols-rounded text-[20px]">share</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-border">
            <div className="text-center space-y-1">
              <p className="text-2xl font-bold font-heading">{profile.stats.posts}</p>
              <p className="text-sm text-muted-foreground font-medium">Posts</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-2xl font-bold font-heading">{profile.stats.followers}</p>
              <p className="text-sm text-muted-foreground font-medium">Followers</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-2xl font-bold font-heading">{profile.stats.following}</p>
              <p className="text-sm text-muted-foreground font-medium">Following</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-2xl font-bold font-heading text-amber-500">{profile.stats.points}</p>
              <p className="text-sm text-muted-foreground font-medium">UniVerse Points</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Sidebar */}
        <div className="space-y-6">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="text-lg font-heading">About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-muted-foreground leading-relaxed">
                {profile.bio}
              </p>
              {backendUser?.department && (
                <div className="flex items-center gap-3 pt-2">
                  <span className="material-symbols-rounded text-muted-foreground text-[20px]">school</span>
                  <span>{backendUser.department.name}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Interests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(backendUser?.interests && backendUser.interests.length > 0) ? backendUser.interests.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1 font-normal bg-secondary/50">
                    {tag}
                  </Badge>
                )) : (
                  <p className="text-sm text-muted-foreground">No interests added yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <span className="material-symbols-rounded text-amber-500">workspace_premium</span>
                Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {(backendUser?.badges && backendUser.badges.length > 0) ? backendUser.badges.map((badge: any) => (
                  <div key={badge.id} className="aspect-square rounded-2xl bg-muted flex flex-col items-center justify-center gap-2 p-2 text-center hover:bg-accent transition-colors cursor-pointer">
                    <span className="material-symbols-rounded text-3xl text-primary/60">military_tech</span>
                    <span className="text-[10px] font-medium leading-tight">{badge.name}</span>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground col-span-3">No badges earned yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 space-x-6">
              <TabsTrigger 
                value="activity" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 font-medium"
              >
                Activity
              </TabsTrigger>
              <TabsTrigger 
                value="academic" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 font-medium"
              >
                Academic
              </TabsTrigger>
              <TabsTrigger 
                value="media" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 font-medium"
              >
                Media
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="activity" className="pt-6 space-y-6">
              <Card className="premium-card">
                <CardContent className="p-12 text-center flex flex-col items-center justify-center text-muted-foreground">
                  <span className="material-symbols-rounded text-6xl mb-4 opacity-20">history</span>
                  <p className="font-medium text-lg text-foreground">No recent activity</p>
                  <p className="text-sm mt-1 max-w-sm">When you share posts or updates, they will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="academic" className="pt-6">
              <Card className="premium-card">
                <CardContent className="p-12 text-center flex flex-col items-center justify-center text-muted-foreground">
                  <span className="material-symbols-rounded text-6xl mb-4 opacity-20">school</span>
                  <p className="font-medium text-lg text-foreground">Academic Profile</p>
                  <p className="text-sm mt-1 max-w-sm">Current courses, transcripts, and academic achievements will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="media" className="pt-6">
              <Card className="premium-card">
                <CardContent className="p-12 text-center flex flex-col items-center justify-center text-muted-foreground">
                  <span className="material-symbols-rounded text-6xl mb-4 opacity-20">perm_media</span>
                  <p className="font-medium text-lg text-foreground">No Media Yet</p>
                  <p className="text-sm mt-1 max-w-sm">Photos and videos shared by this user will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
