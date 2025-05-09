
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarChart2, Calendar, CheckCircle, Inbox, Mail, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";

export const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const navItems = [
    { name: "Dashboard", path: "/", icon: BarChart2 },
    { name: "Inbox", path: "/inbox", icon: Inbox },
    { name: "Tasks", path: "/tasks", icon: CheckCircle },
    { name: "Calendar", path: "/calendar", icon: Calendar },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <aside className={`bg-sidebar border-r border-border flex flex-col ${isMobile ? 'h-full' : 'h-screen'} ${isMobile ? 'w-full' : 'w-64'}`}>
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold flex items-center">
          <Mail className="mr-2 h-6 w-6 text-primary" />
          <span>MailTask</span>
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start",
                (location.pathname === item.path || 
                 (item.path === "/inbox" && location.pathname.startsWith("/email/"))) && 
                 "bg-accent text-accent-foreground"
              )}
            >
              <item.icon className="mr-2 h-5 w-5" />
              {item.name}
            </Button>
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-3">
            <AvatarFallback>{getInitials(user?.user_metadata?.full_name || user?.email)}</AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.user_metadata?.full_name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
