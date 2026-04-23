import React, { useEffect } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { toast } from "sonner";
import { io } from "socket.io-client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function ProtectedLayout() {
  const location = useLocation();

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

  // Simple breadcrumb logic based on pathname
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-2 h-9 w-9 rounded-xl hover:bg-muted transition-colors" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link to="/" className="font-bold text-muted-foreground hover:text-primary transition-colors">UniVerse</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {pathSegments.length > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                {pathSegments.map((segment, index) => {
                  const isLast = index === pathSegments.length - 1;
                  const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
                  const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

                  return (
                    <React.Fragment key={href}>
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage className="font-black text-foreground uppercase italic tracking-tight">{title}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link to={href} className="font-bold text-muted-foreground hover:text-primary transition-colors">{title}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator />}
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          
          <div className="ml-auto flex items-center gap-4">
             <div className="hidden sm:flex items-center px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Live Sync</span>
             </div>
          </div>
        </header>
        
        <main className="flex-1">
          <div className="p-6 md:p-10 max-w-[1600px] mx-auto w-full pb-32">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
