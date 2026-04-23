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
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg font-medium">Synchronizing Systems...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Platform Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Students
            </CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeStudents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +5% from last semester
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-amber-100 bg-amber-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Safety Queue
            </CardTitle>
            <Gavel className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">{stats.reportsPending} Pending</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate review
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              System Health
            </CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.serverHealth}%</div>
            <p className="text-xs text-muted-foreground">
              All clusters operational
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <div className="lg:col-span-1 xl:col-span-2 space-y-8">
           <ChartAreaInteractive data={userGrowthData} />
           
           <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Recent Platform Activity</CardTitle>
                <CardDescription>
                  Real-time events from across the UniVerse.
                </CardDescription>
              </div>
              <Button asChild size="sm" className="ml-auto gap-1">
                <Link to="#">
                  View All
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivity.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div className="font-medium">{activity.user}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                          {activity.action}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {activity.type === 'success' ? 'System' : 'User'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge className="text-xs" variant={activity.type === 'success' ? 'outline' : 'secondary'}>
                          {activity.type === 'success' ? 'Verified' : 'Flagged'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {activity.time}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <Button variant="ghost" size="sm">Details</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm h-fit">
          <CardHeader>
            <CardTitle>Security Status</CardTitle>
            <CardDescription>
              Overview of system access and integrity.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-8">
            <div className="flex items-center gap-4">
              <Avatar className="hidden h-9 w-9 sm:flex">
                <AvatarFallback className="bg-primary/10 text-primary">SC</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">
                  SSL/TLS Encryption
                </p>
                <p className="text-sm text-muted-foreground">
                  Active (Version 1.3)
                </p>
              </div>
              <div className="ml-auto font-medium text-emerald-500 flex items-center">
                <ShieldCheck className="h-4 w-4 mr-1" />
                Secure
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Avatar className="hidden h-9 w-9 sm:flex">
                <AvatarFallback className="bg-primary/10 text-primary">DB</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">
                  Database Backups
                </p>
                <p className="text-sm text-muted-foreground">
                  Last: 12 minutes ago
                </p>
              </div>
              <div className="ml-auto font-medium text-emerald-500 flex items-center">
                <ShieldCheck className="h-4 w-4 mr-1" />
                Valid
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Avatar className="hidden h-9 w-9 sm:flex">
                <AvatarFallback className="bg-primary/10 text-primary">AU</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">
                  Auth Latency
                </p>
                <p className="text-sm text-muted-foreground">
                  Global average
                </p>
              </div>
              <div className="ml-auto font-medium">
                42ms
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">System Alerts</h4>
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <p className="text-sm font-medium">No critical issues detected in the last 24 hours.</p>
              </div>
              <Button variant="outline" className="w-full rounded-xl">Run Security Audit</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Separator() {
  return <div className="h-px bg-border w-full" />
}
