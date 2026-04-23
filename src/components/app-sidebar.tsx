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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3 w-full">
          <div className="w-9 h-9 bg-sidebar-primary rounded-xl flex items-center justify-center shadow-lg shadow-sidebar-primary/20 shrink-0 transition-transform hover:rotate-3">
            <LayoutDashboard className="text-sidebar-primary-foreground h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden">
            <h1 className="font-heading font-black text-sm tracking-tighter text-sidebar-foreground uppercase italic truncate">
              UniVerse<span className="text-sidebar-primary not-italic ml-0.5">Labs</span>
            </h1>
            <p className="text-[8px] font-black text-sidebar-foreground/40 uppercase tracking-[0.2em] leading-none mt-0.5">Command Center</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="custom-scrollbar py-4">
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-sidebar-foreground/30 mb-2">
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
                        className={`h-10 rounded-xl px-3 transition-all duration-200 ${
                          isActive 
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/20" 
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                      >
                        <Link to={item.href}>
                          <item.icon className="h-4.5 w-4.5" />
                          <span className="font-medium tracking-tight">{item.name}</span>
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

      <SidebarFooter className="p-4 border-t border-sidebar-border/50 bg-sidebar-accent/20">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent rounded-xl hover:bg-sidebar-accent/50 transition-colors"
                >
                  <Avatar className="h-9 w-9 rounded-lg border border-sidebar-border">
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback className="rounded-lg bg-sidebar-primary/10 text-sidebar-primary font-black text-xs">
                      {user?.name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden ml-2">
                    <span className="truncate font-bold text-sidebar-foreground">{user?.name}</span>
                    <span className="truncate text-[10px] text-sidebar-foreground/40 font-bold uppercase tracking-widest">
                      Administrator
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl bg-sidebar border-sidebar-border text-sidebar-foreground shadow-2xl"
                side="right"
                align="end"
                sideOffset={8}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-3 px-3 py-3 text-left text-sm">
                    <Avatar className="h-9 w-9 rounded-lg border border-sidebar-border">
                      <AvatarImage src={user?.imageUrl} />
                      <AvatarFallback className="rounded-lg bg-sidebar-primary/10 text-sidebar-primary font-black text-xs">
                        {user?.name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-bold text-sidebar-foreground">{user?.name}</span>
                      <span className="truncate text-[10px] text-sidebar-foreground/40 font-bold">
                        {user?.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-sidebar-border" />
                <DropdownMenuItem onClick={() => navigate("/user/profile")} className="rounded-lg focus:bg-sidebar-accent cursor-pointer">
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/user/settings")} className="rounded-lg focus:bg-sidebar-accent cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-sidebar-border" />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:bg-destructive/10 focus:text-destructive rounded-lg cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
