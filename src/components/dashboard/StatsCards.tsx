
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Mail, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

type StatsData = {
  emailsToday: number;
  emailsYesterday: number;
  pendingTasks: number;
  pendingTasksYesterday: number;
  completedTasks: number;
  completedTasksYesterday: number;
  efficiency: number;
  efficiencyLastWeek: number;
};

export const StatsCards = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<StatsData>({
    emailsToday: 0,
    emailsYesterday: 0,
    pendingTasks: 0,
    pendingTasksYesterday: 0,
    completedTasks: 0,
    completedTasksYesterday: 0,
    efficiency: 0,
    efficiencyLastWeek: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        
        // Format dates for database queries
        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const lastWeekStr = lastWeek.toISOString().split('T')[0];

        // Fetch emails received today
        const { data: emailsToday, error: emailsTodayError } = await supabase
          .from("emails")
          .select("id")
          .eq("user_id", user.id)
          .gte("received_at", todayStr);

        if (emailsTodayError) throw emailsTodayError;

        // Fetch emails received yesterday
        const { data: emailsYesterday, error: emailsYesterdayError } = await supabase
          .from("emails")
          .select("id")
          .eq("user_id", user.id)
          .gte("received_at", yesterdayStr)
          .lt("received_at", todayStr);

        if (emailsYesterdayError) throw emailsYesterdayError;

        // Fetch pending tasks
        const { data: pendingTasks, error: pendingTasksError } = await supabase
          .from("tasks")
          .select("id")
          .eq("user_id", user.id)
          .eq("completed", false);

        if (pendingTasksError) throw pendingTasksError;

        // Fetch pending tasks from yesterday (approximation)
        const { data: pendingTasksYesterday, error: pendingTasksYesterdayError } = await supabase
          .from("tasks")
          .select("id")
          .eq("user_id", user.id)
          .eq("completed", false)
          .lt("created_at", todayStr);

        if (pendingTasksYesterdayError) throw pendingTasksYesterdayError;

        // Fetch completed tasks
        const { data: completedTasks, error: completedTasksError } = await supabase
          .from("tasks")
          .select("id")
          .eq("user_id", user.id)
          .eq("completed", true);

        if (completedTasksError) throw completedTasksError;

        // Fetch completed tasks from yesterday (approximation)
        const { data: completedTasksYesterday, error: completedTasksYesterdayError } = await supabase
          .from("tasks")
          .select("id")
          .eq("user_id", user.id)
          .eq("completed", true)
          .lt("created_at", todayStr)
          .gte("created_at", yesterdayStr);

        if (completedTasksYesterdayError) throw completedTasksYesterdayError;

        // Calculate efficiency (completed tasks / total tasks) * 100
        const totalTasks = (pendingTasks?.length || 0) + (completedTasks?.length || 0);
        const efficiency = totalTasks > 0 
          ? Math.round(((completedTasks?.length || 0) / totalTasks) * 100) 
          : 0;

        // Get tasks from a week ago for comparison
        const { data: tasksLastWeek, error: tasksLastWeekError } = await supabase
          .from("tasks")
          .select("completed")
          .eq("user_id", user.id)
          .lt("created_at", lastWeekStr);

        if (tasksLastWeekError) throw tasksLastWeekError;

        // Calculate efficiency from last week
        const completedTasksLastWeek = tasksLastWeek?.filter(task => task.completed).length || 0;
        const totalTasksLastWeek = tasksLastWeek?.length || 0;
        const efficiencyLastWeek = totalTasksLastWeek > 0 
          ? Math.round((completedTasksLastWeek / totalTasksLastWeek) * 100) 
          : 0;

        setStats({
          emailsToday: emailsToday?.length || 0,
          emailsYesterday: emailsYesterday?.length || 0,
          pendingTasks: pendingTasks?.length || 0,
          pendingTasksYesterday: pendingTasksYesterday?.length || 0,
          completedTasks: completedTasks?.length || 0,
          completedTasksYesterday: completedTasksYesterday?.length || 0,
          efficiency,
          efficiencyLastWeek
        });

      } catch (error) {
        console.error("Error fetching stats:", error);
        toast({
          title: "Error",
          description: "Failed to fetch statistics",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user, toast]);

  // Calculate differences
  const emailsDiff = stats.emailsToday - stats.emailsYesterday;
  const pendingTasksDiff = stats.pendingTasks - stats.pendingTasksYesterday;
  const completedTasksDiff = stats.completedTasks - stats.completedTasksYesterday;
  const efficiencyDiff = stats.efficiency - stats.efficiencyLastWeek;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Emails Processed Today
          </CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.emailsToday}</div>
          <p className="text-xs text-muted-foreground">
            {emailsDiff >= 0 ? "+" : ""}{emailsDiff} from yesterday
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pending Tasks
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingTasks}</div>
          <p className="text-xs text-muted-foreground">
            {pendingTasksDiff >= 0 ? "+" : ""}{pendingTasksDiff} from yesterday
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Completed Tasks
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completedTasks}</div>
          <p className="text-xs text-muted-foreground">
            {completedTasksDiff >= 0 ? "+" : ""}{completedTasksDiff} from yesterday
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Processing Efficiency
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.efficiency}%</div>
          <p className="text-xs text-muted-foreground">
            {efficiencyDiff >= 0 ? "+" : ""}{efficiencyDiff}% from last week
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
