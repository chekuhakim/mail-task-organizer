import { Task } from "@/types";
import { TaskItem } from "./TaskItem";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

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

  const handleTaskItemUpdate = (updatedTask: Task) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    );
    
    if (onTaskUpdate) {
      onTaskUpdate(updatedTask);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onTaskUpdate={handleTaskItemUpdate}
            onTaskDelete={handleTaskDelete}
          />
        ))}
      </div>
    </div>
  );
};
