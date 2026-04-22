import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApiClient } from "@/lib/api-client";
import { useAdminService } from "@/services/admin.service";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Loader2 } from "lucide-react";

// Google Colors: Blue, Green, Yellow, Red
const COLORS = ["#1a73e8", "#34a853", "#fbbc04", "#ea4335", "#8b5cf6", "#ec4899"];

export default function Dashboard() {
  const api = useApiClient();
  const adminService = useAdminService(api);
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeStudents: 0,
    serverHealth: "0.0",
    reportsPending: 0
  });
  
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [roleDistributionData, setRoleDistributionData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      console.log("[Dashboard] Initializing data fetch...");
      try {
        console.log("[Dashboard] Requesting stats, growth, roles, and activity...");
        const [statsRes, growthRes, rolesRes, activityRes] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getDashboardGrowth(),
          adminService.getDashboardRoles(),
          adminService.getDashboardActivity()
        ]);
        console.log("[Dashboard] All requests completed:", { statsRes, growthRes, rolesRes, activityRes });

        if (statsRes.success) {
           setStats(statsRes.data);
        }
        if (growthRes.success) {
           setUserGrowthData(Array.isArray(growthRes.data) ? growthRes.data : []);
        }
        if (rolesRes.success) {
           setRoleDistributionData(Array.isArray(rolesRes.data) ? rolesRes.data : []);
        }
        if (activityRes.success) {
           setRecentActivity(Array.isArray(activityRes.data) ? activityRes.data : []);
        }
      } catch (error) {
        console.error("[Dashboard] FATAL Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && userGrowthData.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg font-medium">Loading Command Center...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="bg-primary/10 border-primary/20 shadow-none">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-rounded text-primary text-[24px]">person_add</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Welcome to UniVerse!</h3>
              <p className="text-muted-foreground">Complete your profile to get the most out of the platform.</p>
            </div>
          </div>
          <Link to="/onboarding">
            <Button className="rounded-full px-6">Complete Profile</Button>
          </Link>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-medium tracking-tight text-foreground font-heading">
            Command Center
          </h2>
          <p className="text-muted-foreground mt-1 text-[15px]">
            Real-time overview of the UniVerse platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-card rounded-full shadow-sm border-border text-primary hover:bg-muted hover:text-primary h-10 px-5 font-medium">
            <span className="material-symbols-rounded mr-2 text-[20px]">dns</span> System Status
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-none h-10 px-5 font-medium">
            <span className="material-symbols-rounded mr-2 text-[20px]">bolt</span> Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="premium-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-rounded text-primary text-[24px]">group</span>
              </div>
              <div className="flex items-center text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                <span className="material-symbols-rounded text-[16px] mr-1">trending_up</span>
                +12%
              </div>
            </div>
            <div className="mt-5">
              <p className="text-[14px] font-medium text-muted-foreground">Total Users</p>
              <h3 className="text-[32px] font-medium text-foreground mt-1 tracking-tight font-heading">{stats.totalUsers.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="premium-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <span className="material-symbols-rounded text-emerald-600 dark:text-emerald-400 text-[24px]">school</span>
              </div>
              <div className="flex items-center text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                <span className="material-symbols-rounded text-[16px] mr-1">trending_up</span>
                +5%
              </div>
            </div>
            <div className="mt-5">
              <p className="text-[14px] font-medium text-muted-foreground">Active Students</p>
              <h3 className="text-[32px] font-medium text-foreground mt-1 tracking-tight font-heading">{stats.activeStudents.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>

        <Link to="/admin/safety/moderation" className="block transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <Card className="premium-card h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <span className="material-symbols-rounded text-amber-600 dark:text-amber-400 text-[24px]">gavel</span>
                </div>
                <div className="flex items-center text-sm font-medium text-destructive bg-destructive/10 px-2.5 py-1 rounded-full">
                  Action Required
                </div>
              </div>
              <div className="mt-5">
                <p className="text-[14px] font-medium text-muted-foreground">Safety Queue</p>
                <h3 className="text-[32px] font-medium text-foreground mt-1 tracking-tight font-heading">{stats.reportsPending} Pending</h3>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="premium-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-rounded text-primary text-[24px]">dns</span>
              </div>
              <div className="flex items-center text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                <span className="material-symbols-rounded text-[16px] mr-1">check_circle</span>
                Stable
              </div>
            </div>
            <div className="mt-5">
              <p className="text-[14px] font-medium text-muted-foreground">Server Health</p>
              <h3 className="text-[32px] font-medium text-foreground mt-1 tracking-tight font-heading">{stats.serverHealth}%</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="premium-card lg:col-span-4">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-[18px] font-medium flex items-center text-foreground font-heading">
              <span className="material-symbols-rounded mr-2 text-[22px] text-primary">monitoring</span> User Growth
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={13} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={13} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "12px", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" }}
                  />
                  <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card lg:col-span-3">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-[18px] font-medium flex items-center text-foreground font-heading">
              <span className="material-symbols-rounded mr-2 text-[22px] text-emerald-500">pie_chart</span> Role Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {roleDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "12px", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="premium-card">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-[18px] font-medium text-foreground font-heading">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="p-5 flex items-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === "success"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : activity.type === "info"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="material-symbols-rounded text-[20px]">
                    {activity.type === "success" ? "check_circle" : activity.type === "info" ? "info" : "history"}
                  </span>
                </div>
                <div className="flex-1 space-y-0.5">
                  <p className="text-[15px] font-medium text-foreground">
                    {activity.user}
                  </p>
                  <p className="text-[14px] text-muted-foreground">{activity.action}</p>
                </div>
                <span className="text-[13px] font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border">
            <Button variant="ghost" className="w-full text-primary hover:text-primary/90 hover:bg-primary/10 font-medium rounded-full h-10">
              View All Activity
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
