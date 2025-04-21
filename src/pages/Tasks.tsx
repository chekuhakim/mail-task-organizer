import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Loader2 } from "lucide-react";
import { TaskList } from "@/components/tasks/TaskList";
import { useToast } from "@/hooks/use-toast";
import { Task } from "@/types";
import { useSearch } from "@/context/SearchContext";

const Tasks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { search } = useSearch();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
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

      // Split tasks by completion status
      setTasks(mappedTasks.filter(task => !task.completed));
      setCompletedTasks(mappedTasks.filter(task => task.completed));
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    if (updatedTask.completed) {
      // Move from active to completed
      setTasks(prev => prev.filter(task => task.id !== updatedTask.id));
      setCompletedTasks(prev => [updatedTask, ...prev]);
    } else {
      // Move from completed to active
      setCompletedTasks(prev => prev.filter(task => task.id !== updatedTask.id));
      setTasks(prev => [updatedTask, ...prev]);
    }
  };

  const filterTasksBySearch = (taskArr: Task[]) =>
    search
      ? taskArr.filter((task) => 
          task.description.toLowerCase().includes(search.toLowerCase()) ||
          task.source.subject.toLowerCase().includes(search.toLowerCase()) ||
          task.source.sender.name.toLowerCase().includes(search.toLowerCase()) ||
          task.source.sender.email.toLowerCase().includes(search.toLowerCase()))
      : taskArr;

  const filteredActive = filterTasksBySearch(tasks);
  const filteredCompleted = filterTasksBySearch(completedTasks);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground">Manage and organize your tasks.</p>
      </div>
      
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Tasks</TabsTrigger>
          <TabsTrigger value="completed">Completed Tasks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Tasks</CardTitle>
              <CardDescription>
                Tasks that need your attention.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredActive.length > 0 ? (
                <TaskList tasks={filteredActive} setTasks={setTasks} onTaskUpdate={handleTaskUpdate} />
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No active tasks found</h3>
                  <p className="text-muted-foreground">
                    {search ? "No results match your search." : "All your tasks are completed"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Tasks</CardTitle>
              <CardDescription>
                Tasks you've already finished.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredCompleted.length > 0 ? (
                <TaskList tasks={filteredCompleted} setTasks={setCompletedTasks} onTaskUpdate={handleTaskUpdate} />
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No completed tasks found</h3>
                  <p className="text-muted-foreground">
                    {search ? "No results match your search." : "Complete some tasks to see them here"}
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

export default Tasks;
