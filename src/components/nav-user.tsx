"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  User as UserIcon,
  Settings
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useClerk } from "@clerk/clerk-react"
import { useNavigate } from "react-router-dom"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const { signOut } = useClerk()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate("/login")
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-12 rounded-xl transition-all hover:bg-sidebar-accent/50"
            >
              <Avatar className="h-8 w-8 rounded-lg border border-sidebar-border shadow-sm">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-sidebar-primary/10 text-sidebar-primary font-black text-xs">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden ml-2">
                <span className="truncate font-bold text-sidebar-foreground">{user.name}</span>
                <span className="truncate text-[10px] text-sidebar-foreground/40 font-bold uppercase tracking-widest leading-none mt-0.5">Admin Level 1</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/20 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-2xl bg-sidebar border-sidebar-border text-sidebar-foreground shadow-2xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-3 text-left text-sm">
                <Avatar className="h-10 w-10 rounded-xl border border-sidebar-border shadow-md">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-xl bg-sidebar-primary/10 text-sidebar-primary font-black text-xs">
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-black italic uppercase text-white">{user.name}</span>
                  <span className="truncate text-[10px] text-sidebar-foreground/40 font-bold">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-sidebar-border" />
            <DropdownMenuGroup className="p-1">
              <DropdownMenuItem className="rounded-xl focus:bg-sidebar-accent cursor-pointer" onClick={() => navigate("/user/profile")}>
                <UserIcon className="mr-2 h-4 w-4" />
                Profile Hub
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl focus:bg-sidebar-accent cursor-pointer" onClick={() => navigate("/user/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Preferences
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-sidebar-border" />
            <DropdownMenuGroup className="p-1">
              <DropdownMenuItem className="rounded-xl focus:bg-sidebar-accent cursor-pointer">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-sidebar-border" />
            <DropdownMenuItem 
              onClick={handleSignOut} 
              className="text-red-400 focus:bg-red-500/10 focus:text-red-400 rounded-xl m-1 cursor-pointer h-10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out Securely
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
