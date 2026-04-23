import * as React from "react"
import {
  LayoutDashboard,
  Users,
  Fingerprint,
  ShieldCheck,
  Network,
  Building2,
  GraduationCap,
  Briefcase,
  Vote,
  VoteIcon,
  Users2,
  MessageSquareWarning,
  AlertTriangle,
  Activity,
  Power,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useUser } from "@/hooks/useUser"
import { Link } from "react-router-dom"

const navigationData = {
  navMain: [
    {
      title: "System Control",
      url: "/admin/system",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        { title: "Admin Dashboard", url: "/" },
        { title: "Universe State", url: "/admin/system/state" },
        { title: "Kill Switch", url: "/admin/system/kill-switch" },
      ],
    },
    {
      title: "Identity & Trust",
      url: "/admin/identity",
      icon: Fingerprint,
      items: [
        { title: "User Directory", url: "/admin/identity/directory" },
        { title: "Digital ID Center", url: "/admin/identity/digital-id" },
        { title: "Access Control (RBAC)", url: "/admin/identity/rbac" },
        { title: "Network Hub", url: "/admin/identity/network" },
      ],
    },
    {
      title: "Campus Operations",
      url: "/admin/campus",
      icon: Building2,
      items: [
        { title: "Buildings & Infrastructure", url: "/admin/campus/buildings" },
        { title: "Academic Manager", url: "/admin/academic/manager" },
        { title: "Registrar Hub", url: "/admin/academic/registrar" },
      ],
    },
    {
      title: "Governance",
      url: "/admin/governance",
      icon: Vote,
      items: [
        { title: "Election Center", url: "/admin/governance/elections" },
        { title: "Voting Center", url: "/user/voting" },
        { title: "Clubs & Guilds", url: "/admin/governance/clubs" },
      ],
    },
    {
      title: "Safety & Integrity",
      url: "/admin/safety",
      icon: MessageSquareWarning,
      items: [
        { title: "Moderation Queue", url: "/admin/safety/moderation" },
        { title: "Crisis Response", url: "/admin/safety/crisis" },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser()

  return (
    <Sidebar collapsible="icon" variant="inset" className="border-r border-sidebar-border" {...props}>
      <SidebarHeader className="h-16 flex items-center px-4">
        <Link to="/" className="flex items-center gap-3 w-full">
          <div className="w-9 h-9 bg-sidebar-primary rounded-xl flex items-center justify-center shadow-lg shadow-sidebar-primary/20 shrink-0">
            <Activity className="text-sidebar-primary-foreground h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden">
            <h1 className="font-heading font-black text-sm tracking-tighter text-sidebar-foreground uppercase italic truncate">
              UniVerse<span className="text-sidebar-primary not-italic ml-0.5">Labs</span>
            </h1>
            <p className="text-[8px] font-black text-sidebar-foreground/40 uppercase tracking-[0.2em] leading-none mt-0.5">Command Center</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigationData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{
          name: user?.name || "Verified User",
          email: user?.email || "user@universelabs.app",
          avatar: user?.imageUrl || ""
        }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
