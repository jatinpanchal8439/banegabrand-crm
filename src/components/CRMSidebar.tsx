import {
  LayoutDashboard, Users, Phone, UserPlus, FileText,
  MessageSquare, Settings, BarChart3,
  Send, LogOut, ChevronDown, ShoppingBag, Wallet, Cake, UserCog,
  Handshake, ListChecks, TicketCheck, Clock, CalendarHeart, FolderOpen, Crown
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

type MenuItem = { title: string; url: string; icon: any; roles?: string[] };

const mainItems: MenuItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Lead Manager", url: "/leads", icon: UserPlus },
  { title: "Contacts", url: "/customers", icon: Users },
  { title: "Deals", url: "/deals", icon: Handshake },
  { title: "Activities", url: "/activities", icon: ListChecks },
  { title: "Quotations", url: "/quotations", icon: FileText },
  { title: "Post Sales", url: "/post-sales", icon: ShoppingBag },
];

const marketingItems: MenuItem[] = [
  { title: "WhatsApp", url: "/messaging/whatsapp", icon: MessageSquare },
  { title: "Bulk Messages", url: "/messaging/bulk", icon: Send },
  { title: "Templates", url: "/messaging/templates", icon: FileText, roles: ["owner", "admin", "manager"] },
];

const adminItems: MenuItem[] = [
  { title: "Owner Panel", url: "/owner-panel", icon: Crown, roles: ["owner", "admin"] },
];

const toolItems: MenuItem[] = [
  { title: "Helpdesk", url: "/helpdesk", icon: TicketCheck },
  { title: "Attendance", url: "/attendance", icon: Clock },
  { title: "Reports", url: "/reports", icon: BarChart3, roles: ["owner", "admin", "manager"] },
  { title: "Calls", url: "/calls", icon: Phone },
  { title: "Expenses", url: "/expenses", icon: Wallet },
  { title: "Files", url: "/files", icon: FolderOpen },
  { title: "Holidays", url: "/holidays", icon: CalendarHeart },
  { title: "Birthday List", url: "/birthdays", icon: Cake },
  { title: "User Management", url: "/users", icon: UserCog, roles: ["owner", "admin"] },
  { title: "Settings", url: "/settings", icon: Settings, roles: ["owner", "admin"] },
];

export function CRMSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { profile, roles, signOut, hasRole } = useAuth();
  const initials = profile?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "U";

  const isOwner = hasRole("owner");
  const roleLabel = isOwner ? "Owner" : hasRole("admin") ? "Admin" : hasRole("manager") ? "Manager" : "Sales Rep";

  const canSee = (item: MenuItem) => {
    if (!item.roles) return true;
    return item.roles.some(r => hasRole(r));
  };

  const renderItems = (items: MenuItem[]) => (
    <SidebarMenu>
      {items.filter(canSee).map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild>
            <NavLink to={item.url} end={item.url === "/"} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
              <item.icon className="mr-2 h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar">
        {!collapsed && (
          <div className="p-4 pb-2">
            <img
              src="/banega-brand-logo.png"
              alt="Banega Brand"
              className="h-12 w-auto rounded"
            />
            <Badge variant="outline" className="mt-1 text-[10px]">{roleLabel}</Badge>
          </div>
        )}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Main</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(mainItems)}</SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <Collapsible defaultOpen={marketingItems.some((i) => location.pathname.startsWith(i.url))}>
            <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
              Marketing 360°
              {!collapsed && <ChevronDown className="h-3 w-3" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>{renderItems(marketingItems)}</SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
        {adminItems.filter(canSee).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50">Admin</SidebarGroupLabel>
            <SidebarGroupContent>{renderItems(adminItems)}</SidebarGroupContent>
          </SidebarGroup>
        )}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Tools</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(toolItems)}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-sidebar border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{profile?.full_name || "User"}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{profile?.designation || roleLabel}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={signOut} className="text-sidebar-foreground/50 hover:text-sidebar-foreground"><LogOut className="h-4 w-4" /></button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
