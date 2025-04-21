
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Loader2 } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { Task } from "@/types";
import { useToast } from "@/hooks/use-toast";

const Calendar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDateTasks, setSelectedDateTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchTasks();
  }, [user]);

  useEffect(() => {
    if (selectedDate && tasks.length > 0) {
      const tasksForDate = tasks.filter(task => 
        task.dueDate && isSameDay(new Date(task.dueDate), selectedDate)
      );
      setSelectedDateTasks(tasksForDate);
    } else {
      setSelectedDateTasks([]);
    }
  }, [selectedDate, tasks]);

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
        .not("due_date", "is", null)
        .order("due_date", { ascending: true });

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

      setTasks(mappedTasks);
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

  const toggleTaskCompleted = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !user) return;

    try {
      // Update local state first (optimistic update)
      const updatedTask = { ...task, completed: !task.completed };
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      setSelectedDateTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));

      // Update database
      const { error } = await supabase
        .from("tasks")
        .update({ completed: updatedTask.completed })
        .eq("id", taskId)
        .eq("user_id", user.id);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
      
      // Revert on error
      setTasks(prev => prev.map(t => t.id === taskId ? task : t));
      setSelectedDateTasks(prev => prev.map(t => t.id === taskId ? task : t));
    }
  };

  // Function to get dates with tasks for calendar highlighting
  const getDatesWithTasks = () => {
    const datesWithTasks = tasks.reduce((acc, task) => {
      if (task.dueDate) {
        const date = new Date(task.dueDate);
        const dateString = format(date, 'yyyy-MM-dd');
        acc[dateString] = true;
      }
      return acc;
    }, {} as Record<string, boolean>);
    
    return datesWithTasks;
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge variant="outline" className="bg-red-50 text-red-600 hover:bg-red-50">High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 hover:bg-amber-50">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50">Low</Badge>;
    }
  };

  const datesWithTasks = getDatesWithTasks();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">View and manage your scheduled tasks.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                booked: (date) => {
                  const dateString = format(date, 'yyyy-MM-dd');
                  return !!datesWithTasks[dateString];
                },
              }}
              modifiersStyles={{
                booked: {
                  fontWeight: 'bold',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6',
                  borderRadius: '0',
                },
              }}
            />
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedDate 
                ? `Tasks for ${format(selectedDate, 'MMMM d, yyyy')}` 
                : 'Select a date to see tasks'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : selectedDateTasks.length > 0 ? (
              <div className="space-y-4">
                {selectedDateTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 border rounded-md">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="mt-0.5"
                      onClick={() => toggleTaskCompleted(task.id)}
                    >
                      <CheckCircle className={`h-5 w-5 ${task.completed ? 'text-green-500 fill-green-500' : 'text-muted-foreground'}`} />
                    </Button>
                    
                    <div className="flex-1 min-w-0">
                      <div className={`text-base ${task.completed ? 'line-through text-muted-foreground' : 'font-medium'}`}>
                        {task.description}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        {getPriorityBadge(task.priority)}
                        
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {task.dueDate ? format(new Date(task.dueDate), 'h:mm a') : 'No time set'}
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-muted-foreground">
                        From: {task.source.sender.name} – {task.source.subject}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No tasks for this date</h3>
                <p className="text-muted-foreground">
                  Select another date or create new tasks
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Calendar;
