import React, { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { io } from "socket.io-client";

const navigationGroups = [
  {
    title: "System Control",
    items: [
      { name: "Admin Dashboard", href: "/", icon: "dashboard", roles: ["admin"] },
      { name: "Universe State", href: "/admin/system/state", icon: "monitoring", roles: ["admin"] },
      { name: "Kill Switch", href: "/admin/system/kill-switch", icon: "emergency_home", roles: ["admin"] },
    ],
  },
  {
    title: "Identity & Trust",
    items: [
      { name: "User Directory", href: "/admin/identity/directory", icon: "group", roles: ["admin"] },
      { name: "Digital ID Center", href: "/admin/identity/digital-id", icon: "fingerprint", roles: ["admin"] },
      { name: "Access Control (RBAC)", href: "/admin/identity/rbac", icon: "admin_panel_settings", roles: ["admin"] },
      { name: "Network Hub", href: "/admin/identity/network", icon: "hub", roles: ["admin"] },
    ],
  },
  {
    title: "Campus Operations",
    items: [
      { name: "Buildings & Infrastructure", href: "/admin/campus/buildings", icon: "domain", roles: ["admin"] },
      { name: "Academic Manager", href: "/admin/academic/manager", icon: "school", roles: ["admin"] },
      { name: "Registrar Hub", href: "/admin/academic/registrar", icon: "how_to_reg", roles: ["admin"] },
    ],
  },
  {
    title: "Governance",
    items: [
      { name: "Election Center", href: "/admin/governance/elections", icon: "ballot", roles: ["admin"] },
      { name: "Voting Center", href: "/user/voting", icon: "how_to_vote", roles: ["admin"] },
      { name: "Clubs & Guilds", href: "/admin/governance/clubs", icon: "diversity_3", roles: ["admin"] },
    ],
  },
  {
    title: "Safety & Integrity",
    items: [
      { name: "Moderation Queue", href: "/admin/safety/moderation", icon: "gavel", roles: ["admin"] },
      { name: "Crisis Response", href: "/admin/safety/crisis", icon: "warning", roles: ["admin"] },
    ],
  },
];

export default function ProtectedLayout() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'https://universe-server-delta.vercel.app';
    const socket = io(backendUrl);

    socket.on('critical_alert', (alert) => {
      toast.error(`Critical Alert: ${alert.message}`, {
        description: alert.time,
        duration: 10000,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-[280px]" : "w-0"
        } bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out relative z-30`}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="material-symbols-rounded text-white filled">rocket_launch</span>
          </div>
          <div>
            <h1 className="font-heading font-black text-xl tracking-tighter text-foreground">
              UniVerse<span className="text-primary text-[10px] ml-1 uppercase tracking-widest font-bold">Admin</span>
            </h1>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-hide">
          {navigationGroups.map((group) => (
            <div key={group.title}>
              <h3 className="px-4 text-[11px] font-bold text-muted-foreground mb-2 uppercase tracking-widest">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    location.pathname === item.href ||
                    (item.href !== "/" && location.pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-4 py-2.5 text-[14px] font-medium rounded-full transition-all duration-200 ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span
                        className={`material-symbols-rounded mr-4 text-[20px] transition-colors duration-200 ${isActive ? "text-white filled" : "text-muted-foreground group-hover:text-foreground"}`}
                      >
                        {item.icon}
                      </span>
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-center gap-3 p-2 bg-card rounded-2xl border border-border">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold uppercase">
                {user?.name?.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{user?.name}</p>
              <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">
                System Administrator
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-full"
          >
            <span className="material-symbols-rounded">
              {isSidebarOpen ? "menu_open" : "menu"}
            </span>
          </Button>

          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Backend Live</span>
             </div>
             
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full w-10 h-10">
                   <span className="material-symbols-rounded text-muted-foreground">settings</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl mt-2 border-border shadow-xl">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/user/profile")} className="rounded-lg cursor-pointer">
                  <span className="material-symbols-rounded mr-2 text-[20px]">person</span>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/user/settings")} className="rounded-lg cursor-pointer">
                  <span className="material-symbols-rounded mr-2 text-[20px]">settings</span>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive rounded-lg cursor-pointer focus:bg-destructive/10 focus:text-destructive">
                  <span className="material-symbols-rounded mr-2 text-[20px]">logout</span>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-background relative">
          <div className="max-w-[1400px] mx-auto pb-20">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
