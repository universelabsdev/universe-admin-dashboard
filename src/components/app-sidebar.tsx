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
      <SidebarHeader>
        <div className="p-2 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <LayoutDashboard className="text-white h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <h1 className="font-heading font-black text-sm tracking-tighter text-foreground">
              UniVerse<span className="text-primary text-[10px] ml-1 uppercase tracking-widest font-bold">Admin</span>
            </h1>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
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
                      >
                        <Link to={item.href}>
                          <item.icon />
                          <span>{item.name}</span>
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
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.imageUrl} alt={user?.name} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                      {user?.name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">{user?.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      System Administrator
                    </span>
                  </div>
                  <Settings className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="right"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user?.imageUrl} alt={user?.name} />
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                        {user?.name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user?.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user?.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/user/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/user/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
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
