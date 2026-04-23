"use client"

import { Link, useLocation } from "react-router-dom"
import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-sidebar-foreground/30 mb-2 px-4">Platform Interface</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isParentActive = location.pathname.startsWith(item.url) || (item.url === "/" && location.pathname === "/");
          
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive || isParentActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    className={`h-10 rounded-xl px-3 transition-all duration-200 ${
                      isParentActive 
                        ? "text-sidebar-primary font-bold" 
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    {item.icon && <item.icon className={`h-4.5 w-4.5 ${isParentActive ? "text-sidebar-primary" : "text-sidebar-foreground/50"}`} />}
                    <span className="tracking-tight">{item.title}</span>
                    <ChevronRight className="ml-auto h-3 w-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-sidebar-foreground/30" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="border-sidebar-border/50 ml-4 py-1 gap-1">
                    {item.items?.map((subItem) => {
                      const isSubActive = location.pathname === subItem.url;
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton 
                            asChild
                            className={`h-8 rounded-lg px-3 transition-all duration-200 ${
                              isSubActive 
                                ? "bg-sidebar-primary text-sidebar-primary-foreground font-black shadow-md shadow-sidebar-primary/10" 
                                : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                            }`}
                          >
                            <Link to={subItem.url}>
                              <span className="text-xs uppercase tracking-widest leading-none">{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
