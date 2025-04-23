
import { Task } from "@/types";
import { TaskItem } from "./TaskItem";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onTaskUpdate?: (task: Task) => void;
}

export const TaskList = ({ tasks, setTasks, onTaskUpdate }: TaskListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleTaskDelete = async (taskId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId)
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      setTasks(prev => prev.filter(task => task.id !== taskId));
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleSyncEmails = async () => {
    if (!user) return;
    
    toast({
      title: "Syncing emails",
      description: "This is a placeholder. In a real app, this would trigger the sync-emails edge function.",
    });

    // TODO: Implement email sync functionality
    // This would call the sync-emails edge function:
    // const { data, error } = await supabase.functions.invoke('sync-emails', {
    //   body: { userId: user.id }
    // });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={handleSyncEmails}
          className="gap-2"
        >
          <Mail className="h-4 w-4" />
          Sync Emails
        </Button>
      </div>

      <div className="space-y-1">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onTaskUpdate={(updatedTask) => {
              if (onTaskUpdate) {
                onTaskUpdate(updatedTask);
              }
            }}
            onTaskDelete={handleTaskDelete}
          />
        ))}
      </div>
    </div>
  );
};
