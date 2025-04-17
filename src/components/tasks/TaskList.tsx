import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Link2, Mail, MoreHorizontal, Tag, Trash } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Task } from "@/types";
import { mockTasks, formatDueDate, getInitials } from "@/lib/mockData";

export const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  const toggleCompleted = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
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
              <Checkbox 
                id={`task-${task.id}`}
                checked={task.completed}
                onCheckedChange={() => toggleCompleted(task.id)}
                className="mt-1"
              />
              
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
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
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
                  <DropdownMenuItem className="flex items-center">
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
