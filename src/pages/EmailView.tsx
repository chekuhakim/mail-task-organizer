
import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle, Loader, Reply, Star, StarOff, Trash } from "lucide-react";
import { format } from "date-fns";
import { Task } from "@/types";
import { getInitials } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const EmailView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!user || !id) return;
    fetchEmailAndTasks();
  }, [user, id]);

  const fetchEmailAndTasks = async () => {
    if (!user || !id) return;
    
    setIsLoading(true);
    try {
      // Fetch email
      const { data: emailData, error: emailError } = await supabase
        .from("emails")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (emailError) throw emailError;

      // Mark as read
      await supabase
        .from("emails")
        .update({ read: true })
        .eq("id", id)
        .eq("user_id", user.id);

      // Fetch tasks
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
        .eq("email_id", id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (tasksError) throw tasksError;

      setEmail(emailData);

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
      console.error("Error fetching email:", error);
      toast({
        title: "Error",
        description: "Failed to fetch email",
        variant: "destructive",
      });
      navigate("/inbox");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStar = async () => {
    if (!user || !email) return;
    
    try {
      // Update locally first
      setEmail({ ...email, starred: !email.starred });
      
      // Update database
      const { error } = await supabase
        .from("emails")
        .update({ starred: !email.starred })
        .eq("id", id)
        .eq("user_id", user.id);
      
      if (error) throw error;
    } catch (error: any) {
      // Revert on error
      setEmail({ ...email, starred: email.starred });
      toast({
        title: "Error",
        description: "Failed to update email",
        variant: "destructive",
      });
      console.error("Error updating email:", error);
    }
  };

  const deleteEmail = async () => {
    if (!user || !id) return;
    
    try {
      const { error } = await supabase
        .from("emails")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Email deleted",
      });
      
      navigate("/inbox");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete email",
        variant: "destructive",
      });
      console.error("Error deleting email:", error);
    }
  };

  const toggleTaskCompleted = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !user) return;

    try {
      // Update local state first (optimistic update)
      const updatedTask = { ...task, completed: !task.completed };
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));

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
    }
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/inbox">
              <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
            </Link>
          </Button>
          <h1 className="text-lg md:text-3xl font-bold tracking-tight">Email not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link to="/inbox">
            <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
          </Link>
        </Button>
        <h1 className="text-base md:text-xl font-bold tracking-tight truncate">{email.subject}</h1>
      </div>
      
      <Card>
        <CardHeader className="flex-col md:flex-row items-start space-y-4 md:space-y-0 md:justify-between p-3 md:p-6">
          <div className="flex items-start space-x-3 w-full">
            <Avatar className="h-8 w-8 md:h-10 md:w-10 shrink-0">
              <AvatarImage src={null} alt={email.sender_name} />
              <AvatarFallback>{getInitials(email.sender_name)}</AvatarFallback>
            </Avatar>
            
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm md:text-base break-words">{email.sender_name}</div>
              <div className="text-xs md:text-sm text-muted-foreground break-all">{email.sender_email}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {format(new Date(email.received_at), 'PPP p')}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 self-start mt-2 md:mt-0 ml-11 md:ml-0">
            <Button variant="ghost" size="sm" className="h-6 w-6 md:h-8 md:w-8 p-0" onClick={toggleStar}>
              {email.starred ? (
                <Star className="h-3 w-3 md:h-4 md:w-4 text-amber-500 fill-amber-500" />
              ) : (
                <StarOff className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              )}
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 md:h-8 md:w-8 p-0">
              <Reply className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 md:h-8 md:w-8 p-0" onClick={deleteEmail}>
              <Trash className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <Separator />
        
        <CardContent className="p-3 md:p-6">
          {email.summary && (
            <>
              <div className="mb-4">
                <h3 className="text-xs md:text-sm font-medium mb-2">AI Summary</h3>
                <div className="bg-muted p-2 md:p-3 rounded-md text-xs md:text-sm break-words">{email.summary}</div>
              </div>
              <Separator className="my-3 md:my-4" />
            </>
          )}
          
          <ScrollArea className="pr-2 md:pr-4 max-h-[40vh] md:max-h-[50vh]">
            <div className="whitespace-pre-line break-words text-xs md:text-sm">{email.body}</div>
          </ScrollArea>
          
          {tasks.length > 0 && (
            <>
              <Separator className="my-4 md:my-6" />
              
              <div>
                <h3 className="text-base md:text-lg font-medium mb-3">Related Tasks</h3>
                <div className="space-y-2 md:space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-2 p-2 md:p-3 border rounded-md">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 mt-0.5 shrink-0"
                        onClick={() => toggleTaskCompleted(task.id)}
                      >
                        <CheckCircle className={`h-4 w-4 md:h-5 md:w-5 ${task.completed ? 'text-green-500 fill-green-500' : 'text-muted-foreground'}`} />
                      </Button>
                      
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs md:text-sm break-words ${task.completed ? 'line-through text-muted-foreground' : 'font-medium'}`}>
                          {task.description}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {getPriorityBadge(task.priority)}
                          
                          {task.dueDate && (
                            <div className="flex items-center text-[10px] md:text-xs text-muted-foreground">
                              <div>Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailView;
