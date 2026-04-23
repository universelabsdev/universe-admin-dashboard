import * as React from "react"
import { useEffect, useState, useMemo } from "react"
import { Link } from "react-router-dom"
import {
  Activity,
  ArrowUpRight,
  CircleUser,
  CreditCard,
  DollarSign,
  Menu,
  Package2,
  Search,
  Users,
  School,
  Gavel,
  ShieldCheck,
  TrendingUp,
  Loader2
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useApiClient } from "@/lib/api-client"
import { useAdminService } from "@/services/admin.service"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"

import {
  Separator
} from "@/components/ui/separator"

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
      try {
        const [statsRes, growthRes, rolesRes, activityRes] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getDashboardGrowth(),
          adminService.getDashboardRoles(),
          adminService.getDashboardActivity()
        ]);

        if (statsRes.success) setStats(statsRes.data);
        if (growthRes.success) setUserGrowthData(Array.isArray(growthRes.data) ? growthRes.data : []);
        if (rolesRes.success) setRoleDistributionData(Array.isArray(rolesRes.data) ? rolesRes.data : []);
        if (activityRes.success) setRecentActivity(Array.isArray(activityRes.data) ? activityRes.data : []);
      } catch (error) {
        console.error("[Dashboard] Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && userGrowthData.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
        <span className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Syncing Command Center...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Total Identities
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">
              +12.1% <span className="text-muted-foreground/60 font-medium">Growth Rate</span>
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Active Students
            </CardTitle>
            <School className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight">{stats.activeStudents.toLocaleString()}</div>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">
              +5% <span className="text-muted-foreground/60 font-medium">Current Semester</span>
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card ring-1 ring-destructive/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-destructive">
              Safety Alerts
            </CardTitle>
            <Gavel className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-destructive">{stats.reportsPending}</div>
            <p className="text-[10px] text-destructive/60 font-bold mt-1 uppercase">
              Action Required
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              System Uptime
            </CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight">{stats.serverHealth}%</div>
            <p className="text-[10px] text-emerald-500/60 font-bold mt-1 uppercase">
              Optimal Status
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <div className="lg:col-span-1 xl:col-span-2 space-y-8">
           <ChartAreaInteractive data={userGrowthData} />
           
           <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center bg-muted/30 pb-4">
              <div className="grid gap-1">
                <CardTitle className="text-lg font-bold tracking-tight">Recent Activity</CardTitle>
                <CardDescription className="text-xs">
                  Real-time events from across the UniVerse.
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="outline" className="ml-auto rounded-full px-4 h-8 text-xs font-bold uppercase tracking-widest">
                <Link to="#">
                  Logs
                  <ArrowUpRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="pl-6 h-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground">User</TableHead>
                    <TableHead className="hidden sm:table-cell h-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</TableHead>
                    <TableHead className="hidden sm:table-cell h-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</TableHead>
                    <TableHead className="hidden md:table-cell h-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</TableHead>
                    <TableHead className="text-right pr-6 h-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivity.map((activity) => (
                    <TableRow key={activity.id} className="hover:bg-muted/5 transition-colors border-muted/20">
                      <TableCell className="pl-6 py-4">
                        <div className="font-bold text-sm">{activity.user}</div>
                        <div className="hidden text-[10px] text-muted-foreground md:inline font-medium uppercase tracking-tight">
                          {activity.action}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{activity.type === 'success' ? 'System' : 'User'}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge className="text-[9px] font-black uppercase rounded-md px-1.5 h-5" variant={activity.type === 'success' ? 'outline' : 'secondary'}>
                          {activity.type === 'success' ? 'Verified' : 'Flagged'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-xs font-medium text-muted-foreground">{activity.time}</span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-bold text-primary">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm h-fit bg-card overflow-hidden">
          <CardHeader className="bg-primary/5 pb-6">
            <CardTitle className="text-lg font-bold tracking-tight">Security Status</CardTitle>
            <CardDescription className="text-xs">
              System access and integrity metrics.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-8 p-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                 <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="grid gap-0.5">
                <p className="text-sm font-bold leading-none">
                  SSL/TLS Encryption
                </p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                  Version 1.3 Active
                </p>
              </div>
              <div className="ml-auto font-black text-[10px] text-emerald-500 uppercase tracking-widest">
                Secure
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                 <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="grid gap-0.5">
                <p className="text-sm font-bold leading-none">
                  Snapshot Integrity
                </p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                  12m since last sync
                </p>
              </div>
              <div className="ml-auto font-black text-[10px] text-emerald-500 uppercase tracking-widest">
                Valid
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                 <Activity className="h-5 w-5 text-primary" />
              </div>
              <div className="grid gap-0.5">
                <p className="text-sm font-bold leading-none">
                  Auth Latency
                </p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                  Global Average
                </p>
              </div>
              <div className="ml-auto font-black text-sm tabular-nums">
                42ms
              </div>
            </div>
            
            <Separator className="bg-muted/50" />
            
            <div className="space-y-4 pt-2">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Intelligence Feed</h4>
              <div className="p-4 rounded-2xl bg-muted/20 border border-muted/50">
                <p className="text-xs font-medium text-muted-foreground leading-relaxed">No critical anomalies detected in the last <span className="text-foreground font-bold">24 hours</span>.</p>
              </div>
              <Button variant="outline" className="w-full rounded-2xl h-12 font-black uppercase text-[10px] tracking-[0.2em] shadow-sm">Initialize Security Audit</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
