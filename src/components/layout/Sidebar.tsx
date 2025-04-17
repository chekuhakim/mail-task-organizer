
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarChart2, Calendar, CheckCircle, Inbox, Mail, Settings } from "lucide-react";

export const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { name: "Dashboard", path: "/", icon: BarChart2 },
    { name: "Inbox", path: "/inbox", icon: Inbox },
    { name: "Tasks", path: "/tasks", icon: CheckCircle },
    { name: "Calendar", path: "/calendar", icon: Calendar },
    { name: "Email", path: "/email", icon: Mail },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-sidebar border-r border-border flex flex-col h-screen">
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
                location.pathname === item.path && "bg-accent text-accent-foreground"
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
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <span className="text-sm font-medium">JD</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">John Doe</p>
            <p className="text-xs text-muted-foreground">john@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
