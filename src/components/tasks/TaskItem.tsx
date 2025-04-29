
import { useState } from "react";
import { Task } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Link2, Loader, Mail, MoreHorizontal, Trash } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { getInitials } from "@/lib/mockData";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  onTaskUpdate: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
}

export const TaskItem = ({ task, onTaskUpdate, onTaskDelete }: TaskItemProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState<Date | undefined>(
    task.dueDate ? new Date(task.dueDate) : undefined
  );

  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge variant="outline" className="bg-red-50 text-red-600 hover:bg-red-50">High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 hover:bg-amber-50">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50">Low</Badge>;
      default:
        return null;
    }
  };

  const handleToggleComplete = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ completed: !task.completed })
        .eq("id", task.id)
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      const updatedTask = { ...task, completed: !task.completed };
      onTaskUpdate(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriorityChange = async (newPriority: Task['priority']) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ priority: newPriority })
        .eq("id", task.id)
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      // Update the local task object with the new priority without creating a new entry
      const updatedTask = { ...task, priority: newPriority };
      onTaskUpdate(updatedTask);
    } catch (error) {
      console.error("Error updating task priority:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = async (newDate: Date | undefined) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ due_date: newDate?.toISOString() })
        .eq("id", task.id)
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      setDate(newDate);
      // Update the local task object with the new due date without creating a new entry
      const updatedTask = { ...task, dueDate: newDate?.toISOString() };
      onTaskUpdate(updatedTask);
    } catch (error) {
      console.error("Error updating task due date:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-3 rounded-md hover:bg-muted/50">
      <div className="flex flex-col md:flex-row md:items-start gap-3">
        <div className="flex items-center">
          {isLoading ? (
            <Loader className="h-4 w-4 animate-spin ml-1 mr-1 mt-1" />
          ) : (
            <Checkbox 
              id={`task-${task.id}`}
              checked={task.completed}
              onCheckedChange={handleToggleComplete}
              className="mt-1"
              disabled={isLoading}
            />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
            <div className={`text-base break-words ${task.completed ? 'line-through text-muted-foreground' : 'font-medium'}`}>
              {task.description}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Calendar className="h-4 w-4 mr-2" />
                    {date ? format(date, 'PPP') : 'Set due date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={handleDateChange}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              <Select 
                defaultValue={task.priority} 
                onValueChange={handlePriorityChange}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue>
                    {getPriorityBadge(task.priority)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    {getPriorityBadge('low')}
                  </SelectItem>
                  <SelectItem value="medium">
                    {getPriorityBadge('medium')}
                  </SelectItem>
                  <SelectItem value="high">
                    {getPriorityBadge('high')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center">
              <Mail className="h-3 w-3 mr-1" />
              <span className="truncate max-w-[200px]">From: {task.source.subject}</span>
            </div>
            
            <div className="flex items-center">
              <Avatar className="h-4 w-4 mr-1">
                <AvatarFallback>{getInitials(task.source.sender.name)}</AvatarFallback>
              </Avatar>
              <span>{task.source.sender.name}</span>
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 self-start" disabled={isLoading}>
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="flex items-center" asChild>
              <Link to={`/email/${task.source.id}`}>
                <Link2 className="mr-2 h-4 w-4" />
                <span>View Source Email</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="flex items-center text-destructive focus:text-destructive" 
              onClick={() => onTaskDelete(task.id)}
            >
              <Trash className="mr-2 h-4 w-4" />
              <span>Delete Task</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
