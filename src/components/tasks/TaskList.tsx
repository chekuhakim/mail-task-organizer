
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Link2, Loader2, Mail, MoreHorizontal, Tag, Trash } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Task } from "@/types";
import { formatDueDate, getInitials } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";

interface TaskListProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export const TaskList = ({ tasks, setTasks }: TaskListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = (id: string, isLoading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [id]: isLoading }));
  };

  const isLoading = (id: string) => loadingStates[id] || false;

  const toggleCompleted = async (id: string) => {
    if (!user) return;
    
    // Find the task and toggle its completed status in state
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    try {
      setLoading(id, true);
      
      // Update the database
      const { error } = await supabase
        .from("tasks")
        .update({ completed: !task.completed })
        .eq("id", id)
        .eq("user_id", user.id);
      
      if (error) throw error;
    } catch (error: any) {
      // Revert on error
      setTasks(tasks);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
      console.error("Error updating task:", error);
    } finally {
      setLoading(id, false);
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    
    // Update the state first (optimistic update)
    const updatedTasks = tasks.filter(task => task.id !== id);
    setTasks(updatedTasks);
    
    try {
      setLoading(id, true);
      
      // Delete from the database
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Task deleted",
      });
    } catch (error: any) {
      // Revert on error
      setTasks(tasks);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
      console.error("Error deleting task:", error);
    } finally {
      setLoading(id, false);
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

  return (
    <div className="space-y-1">
      {tasks.map((task, index) => (
        <div key={task.id}>
          <div className="p-3 rounded-md hover:bg-muted/50">
            <div className="flex items-start gap-3">
              <div className="flex items-center">
                {isLoading(task.id) ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-1 mr-1 mt-1" />
                ) : (
                  <Checkbox 
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => toggleCompleted(task.id)}
                    className="mt-1"
                    disabled={isLoading(task.id)}
                  />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className={`text-base ${task.completed ? 'line-through text-muted-foreground' : 'font-medium'}`}>
                    {task.description}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(task.priority)}
                    
                    {task.dueDate && (
                      <div className="flex items-center text-xs bg-background px-2 py-1 rounded-md border border-input">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDueDate(task.dueDate)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <Mail className="h-3 w-3 mr-1" />
                    <span>From email: {task.source.subject}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Avatar className="h-4 w-4 mr-1">
                      <AvatarImage src={task.source.sender.avatar} alt={task.source.sender.name} />
                      <AvatarFallback className="text-[10px]">{getInitials(task.source.sender.name)}</AvatarFallback>
                    </Avatar>
                    <span>{task.source.sender.name}</span>
                  </div>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLoading(task.id)}>
                    {isLoading(task.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MoreHorizontal className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="flex items-center">
                    <Link2 className="mr-2 h-4 w-4" />
                    <span>View Source Email</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center">
                    <Tag className="mr-2 h-4 w-4" />
                    <span>Change Priority</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center" onClick={() => deleteTask(task.id)}>
                    <Trash className="mr-2 h-4 w-4" />
                    <span>Delete Task</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {index < tasks.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  );
};
