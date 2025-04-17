
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Eye, Loader2, Star, StarOff, Trash } from "lucide-react";
import { Email } from "@/types";
import { formatDate, getInitials } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";

interface EmailListProps {
  emails: Email[];
  setEmails: React.Dispatch<React.SetStateAction<Email[]>>;
}

export const EmailList = ({ emails, setEmails }: EmailListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = (id: string, isLoading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [id]: isLoading }));
  };

  const isLoading = (id: string) => loadingStates[id] || false;

  const toggleRead = async (id: string) => {
    if (!user) return;
    
    // Find the email and toggle its read status in state
    const updatedEmails = emails.map(email => 
      email.id === id ? { ...email, read: !email.read } : email
    );
    setEmails(updatedEmails);
    
    const email = emails.find(e => e.id === id);
    if (!email) return;
    
    try {
      setLoading(id, true);
      
      // Update the database
      const { error } = await supabase
        .from("emails")
        .update({ read: !email.read })
        .eq("id", id)
        .eq("user_id", user.id);
      
      if (error) throw error;
    } catch (error: any) {
      // Revert on error
      setEmails(emails);
      toast({
        title: "Error",
        description: "Failed to update email",
        variant: "destructive",
      });
      console.error("Error updating email:", error);
    } finally {
      setLoading(id, false);
    }
  };

  const toggleStar = async (id: string) => {
    if (!user) return;
    
    // Find the email and toggle its starred status in state
    const updatedEmails = emails.map(email => 
      email.id === id ? { ...email, starred: !email.starred } : email
    );
    setEmails(updatedEmails);
    
    const email = emails.find(e => e.id === id);
    if (!email) return;
    
    try {
      setLoading(id, true);
      
      // Update the database
      const { error } = await supabase
        .from("emails")
        .update({ starred: !email.starred })
        .eq("id", id)
        .eq("user_id", user.id);
      
      if (error) throw error;
    } catch (error: any) {
      // Revert on error
      setEmails(emails);
      toast({
        title: "Error",
        description: "Failed to update email",
        variant: "destructive",
      });
      console.error("Error updating email:", error);
    } finally {
      setLoading(id, false);
    }
  };

  const deleteEmail = async (id: string) => {
    if (!user) return;
    
    // Update the state first (optimistic update)
    const updatedEmails = emails.filter(email => email.id !== id);
    setEmails(updatedEmails);
    
    try {
      setLoading(id, true);
      
      // Delete from the database
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
    } catch (error: any) {
      // Revert on error
      setEmails(emails);
      toast({
        title: "Error",
        description: "Failed to delete email",
        variant: "destructive",
      });
      console.error("Error deleting email:", error);
    } finally {
      setLoading(id, false);
    }
  };

  return (
    <div className="space-y-1">
      {emails.map((email, index) => (
        <div key={email.id}>
          <div className={`p-3 rounded-md flex items-start gap-4 hover:bg-muted/50 ${!email.read ? 'bg-blue-50' : ''}`}>
            <div className="flex items-center gap-2">
              <Checkbox id={`select-${email.id}`} />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => toggleStar(email.id)}
                disabled={isLoading(email.id)}
              >
                {isLoading(email.id) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : email.starred ? (
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                ) : (
                  <StarOff className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>

            <Avatar className="h-8 w-8">
              <AvatarImage src={email.sender.avatar} alt={email.sender.name} />
              <AvatarFallback>{getInitials(email.sender.name)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div className="font-medium truncate pr-4">
                  {email.subject}
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(email.receivedAt)}
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                <span className="font-medium">{email.sender.name}</span>
                {" - "}
                {email.summary.length > 120 ? 
                  `${email.summary.substring(0, 120)}...` : 
                  email.summary
                }
              </div>
              <div className="mt-2 flex items-center gap-2">
                {email.tasks > 0 && (
                  <Badge variant="outline" className="text-xs bg-task-light text-task">
                    {email.tasks} {email.tasks === 1 ? 'task' : 'tasks'}
                  </Badge>
                )}
                {!email.read && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600">
                    Unread
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => toggleRead(email.id)}
                disabled={isLoading(email.id)}
              >
                {isLoading(email.id) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => deleteEmail(email.id)}
                disabled={isLoading(email.id)}
              >
                {isLoading(email.id) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          {index < emails.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  );
};
