import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Mail } from "lucide-react";
import { EmailList } from "@/components/email/EmailList";
import { TaskList } from "@/components/tasks/TaskList";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { useToast } from "@/hooks/use-toast";
import { Email, Task } from "@/types";

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [emails, setEmails] = useState<Email[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: emailsData, error: emailsError } = await supabase
          .from("emails")
          .select("*")
          .eq("user_id", user.id)
          .order("received_at", { ascending: false });

        if (emailsError) throw emailsError;

        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select(`
            *,
            emails!inner (
              subject,
              sender_name,
              sender_email
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (tasksError) throw tasksError;

        const mappedEmails: Email[] = emailsData.map(email => ({
          id: email.id,
          subject: email.subject,
          sender: {
            name: email.sender_name,
            email: email.sender_email,
          },
          receivedAt: email.received_at,
          summary: email.summary || "",
          body: email.body || "",
          read: email.read || false,
          starred: email.starred || false,
          tasks: 0,
        }));

        const taskCounts: Record<string, number> = {};
        tasksData.forEach(task => {
          if (!taskCounts[task.email_id]) {
            taskCounts[task.email_id] = 0;
          }
          taskCounts[task.email_id]++;
        });

        mappedEmails.forEach(email => {
          email.tasks = taskCounts[email.id] || 0;
        });

        const mappedTasks: Task[] = tasksData.map(task => ({
          id: task.id,
          description: task.description,
          completed: task.completed || false,
          priority: task.priority as "low" | "medium" | "high",
          createdAt: task.created_at,
          dueDate: task.due_date,
          source: {
            type: "email",
            id: task.email_id,
            subject: task.emails.subject,
            sender: {
              name: task.emails.sender_name,
              email: task.emails.sender_email,
            }
          }
        }));

        setEmails(mappedEmails);
        setTasks(mappedTasks);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">View your daily email summaries and tasks.</p>
      </div>
      
      <StatsCards />
      
      <Tabs defaultValue="emails" className="space-y-4">
        <TabsList>
          <TabsTrigger value="emails" className="flex items-center">
            <Mail className="mr-2 h-4 w-4" />
            Emails
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center">
            <CheckCircle className="mr-2 h-4 w-4" />
            Tasks
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="emails" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Email Summaries</CardTitle>
              <CardDescription>
                AI-generated summaries of your recent emails.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : emails.length > 0 ? (
                <EmailList emails={emails} setEmails={setEmails} />
              ) : (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No emails yet</h3>
                  <p className="text-muted-foreground">
                    Sync your emails to see AI-generated summaries here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task List</CardTitle>
              <CardDescription>
                Tasks extracted from your emails.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : tasks.length > 0 ? (
                <TaskList tasks={tasks} setTasks={setTasks} />
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No tasks yet</h3>
                  <p className="text-muted-foreground">
                    Tasks extracted from emails will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
