
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Eye, Loader, Star, StarOff, Trash } from "lucide-react";
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
  const navigate = useNavigate();
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

  const handleEmailClick = (id: string) => {
    navigate(`/email/${id}`);
  };

  return (
    <div className="space-y-1">
      {emails.map((email, index) => (
        <div key={email.id}>
          <div 
            className={`p-3 rounded-md flex flex-col md:flex-row items-start gap-4 hover:bg-muted/50 ${!email.read ? 'bg-blue-50' : ''} cursor-pointer`}
            onClick={() => handleEmailClick(email.id)}
          >
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Checkbox id={`select-${email.id}`} onClick={(e) => e.stopPropagation()} />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStar(email.id);
                }}
                disabled={isLoading(email.id)}
              >
                {isLoading(email.id) ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : email.starred ? (
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                ) : (
                  <StarOff className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarImage src={email.sender.avatar} alt={email.sender.name} />
                <AvatarFallback>{getInitials(email.sender.name)}</AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 min-w-0 w-full">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center w-full">
                <div className="font-medium truncate max-w-full md:max-w-[70%] pr-2">
                  {email.subject}
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap mt-1 md:mt-0">
                  {formatDate(email.receivedAt)}
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-1 break-words">
                <span className="font-medium">{email.sender.name}</span>
                {" - "}
                <span className="line-clamp-2">
                  {email.summary.length > 120 ? 
                    `${email.summary.substring(0, 120)}...` : 
                    email.summary
                  }
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
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

            <div className="flex items-center gap-1 self-start md:self-center mt-2 md:mt-0" onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRead(email.id);
                }}
                disabled={isLoading(email.id)}
              >
                {isLoading(email.id) ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteEmail(email.id);
                }}
                disabled={isLoading(email.id)}
              >
                {isLoading(email.id) ? (
                  <Loader className="h-4 w-4 animate-spin" />
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
