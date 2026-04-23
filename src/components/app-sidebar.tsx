import * as React from "react"
import {
  LayoutDashboard,
  ShieldAlert,
  Power,
  Users,
  Fingerprint,
  Settings,
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
  LogOut,
  User,
  Activity
} from "lucide-react"

import { useUser } from "@/hooks/useUser"
import { useClerk } from "@clerk/clerk-react"
import { useNavigate, useLocation, Link } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const navigationGroups = [
  {
    title: "System Control",
    items: [
      { name: "Admin Dashboard", href: "/", icon: LayoutDashboard, roles: ["admin"] },
      { name: "Universe State", href: "/admin/system/state", icon: Activity, roles: ["admin"] },
      { name: "Kill Switch", href: "/admin/system/kill-switch", icon: Power, roles: ["admin"] },
    ],
  },
  {
    title: "Identity & Trust",
    items: [
      { name: "User Directory", href: "/admin/identity/directory", icon: Users, roles: ["admin"] },
      { name: "Digital ID Center", href: "/admin/identity/digital-id", icon: Fingerprint, roles: ["admin"] },
      { name: "Access Control (RBAC)", href: "/admin/identity/rbac", icon: ShieldCheck, roles: ["admin"] },
      { name: "Network Hub", href: "/admin/identity/network", icon: Network, roles: ["admin"] },
    ],
  },
  {
    title: "Campus Operations",
    items: [
      { name: "Buildings & Infrastructure", href: "/admin/campus/buildings", icon: Building2, roles: ["admin"] },
      { name: "Academic Manager", href: "/admin/academic/manager", icon: GraduationCap, roles: ["admin"] },
      { name: "Registrar Hub", href: "/admin/academic/registrar", icon: Briefcase, roles: ["admin"] },
    ],
  },
  {
    title: "Governance",
    items: [
      { name: "Election Center", href: "/admin/governance/elections", icon: Vote, roles: ["admin"] },
      { name: "Voting Center", href: "/user/voting", icon: VoteIcon, roles: ["admin"] },
      { name: "Clubs & Guilds", href: "/admin/governance/clubs", icon: Users2, roles: ["admin"] },
    ],
  },
  {
    title: "Safety & Integrity",
    items: [
      { name: "Moderation Queue", href: "/admin/safety/moderation", icon: MessageSquareWarning, roles: ["admin"] },
      { name: "Crisis Response", href: "/admin/safety/crisis", icon: AlertTriangle, roles: ["admin"] },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border" {...props}>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/40 shrink-0 rotate-[-4deg]">
            <LayoutDashboard className="text-white h-6 w-6" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <h1 className="font-heading font-black text-lg tracking-tighter text-white uppercase italic">
              UniVerse<span className="text-primary text-[10px] ml-1 uppercase tracking-widest font-black not-italic">Labs</span>
            </h1>
            <p className="text-[9px] font-black text-sidebar-foreground uppercase tracking-[0.2em] leading-none">Command Center</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.title} className="py-4">
            <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-sidebar-foreground/40 mb-2 px-4">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    location.pathname === item.href ||
                    (item.href !== "/" && location.pathname.startsWith(item.href));
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.name}
                        className={`h-11 rounded-xl px-4 transition-all duration-200 ${
                          isActive 
                            ? "bg-primary text-white shadow-lg shadow-primary/20 font-bold" 
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
                        }`}
                      >
                        <Link to={item.href}>
                          <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-sidebar-foreground/60 group-hover:text-white"}`} />
                          <span className="text-sm tracking-tight">{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-white rounded-2xl border border-sidebar-border bg-sidebar-accent/50 h-16"
                >
                  <Avatar className="h-10 w-10 rounded-xl border-2 border-sidebar-border shadow-lg">
                    <AvatarImage src={user?.imageUrl} alt={user?.name} />
                    <AvatarFallback className="rounded-xl bg-primary text-white font-black">
                      {user?.name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden ml-2">
                    <span className="truncate font-black text-white italic uppercase tracking-tight">{user?.name}</span>
                    <span className="truncate text-[10px] text-sidebar-foreground font-bold uppercase tracking-widest">
                      Administrator
                    </span>
                  </div>
                  <Settings className="ml-auto size-4 group-data-[collapsible=icon]:hidden text-sidebar-foreground/40" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-2xl bg-sidebar border-sidebar-border text-white shadow-2xl p-2"
                side="right"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-3 px-3 py-3 text-left text-sm">
                    <Avatar className="h-10 w-10 rounded-xl border border-sidebar-border shadow-md">
                      <AvatarImage src={user?.imageUrl} alt={user?.name} />
                      <AvatarFallback className="rounded-xl bg-primary text-white font-black text-xs">
                        {user?.name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-black italic uppercase text-white">{user?.name}</span>
                      <span className="truncate text-[10px] text-sidebar-foreground font-bold">
                        {user?.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-sidebar-border" />
                <DropdownMenuItem onClick={() => navigate("/user/profile")} className="rounded-xl focus:bg-sidebar-accent focus:text-white cursor-pointer h-10">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/user/settings")} className="rounded-xl focus:bg-sidebar-accent focus:text-white cursor-pointer h-10">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-sidebar-border" />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-400 focus:bg-red-500/10 focus:text-red-400 rounded-xl cursor-pointer h-10">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
