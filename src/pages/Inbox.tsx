
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Inbox as InboxIcon, Loader2, RefreshCw } from "lucide-react";
import { EmailList } from "@/components/email/EmailList";
import { useToast } from "@/hooks/use-toast";
import { Email } from "@/types";

const Inbox = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchEmails();
  }, [user]);

  const fetchEmails = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data: emailsData, error: emailsError } = await supabase
        .from("emails")
        .select("*")
        .eq("user_id", user.id)
        .order("received_at", { ascending: false });

      if (emailsError) throw emailsError;

      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("email_id")
        .eq("user_id", user.id);

      if (tasksError) throw tasksError;

      const taskCounts: Record<string, number> = {};
      tasksData.forEach(task => {
        if (!taskCounts[task.email_id]) {
          taskCounts[task.email_id] = 0;
        }
        taskCounts[task.email_id]++;
      });

      const mappedEmails: Email[] = emailsData.map(email => ({
        id: email.id,
        subject: email.subject,
        sender: {
          name: email.sender_name,
          email: email.sender_email,
        },
        receivedAt: email.received_at,
        summary: email.summary || "",
        body: email.body || "",
        read: email.read || false,
        starred: email.starred || false,
        tasks: taskCounts[email.id] || 0,
      }));

      setEmails(mappedEmails);
    } catch (error: any) {
      console.error("Error fetching emails:", error);
      toast({
        title: "Error",
        description: "Failed to fetch emails",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncEmails = async () => {
    if (!user) return;

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-emails', {
        body: { userId: user.id },
      });

      if (error) throw new Error(error.message);

      const successMessage = data.usesMockData 
        ? "Successfully processed mock emails. Please configure valid IMAP settings for real emails."
        : `Successfully processed ${data.processedEmails || 0} emails`;

      toast({
        title: "Sync Completed",
        description: successMessage,
      });

      // Refresh the emails list
      fetchEmails();
    } catch (error: any) {
      console.error("Error syncing emails:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to sync emails",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
          <p className="text-muted-foreground">View and manage your emails.</p>
        </div>
        <Button 
          onClick={syncEmails} 
          disabled={isSyncing}
          className="flex items-center gap-2"
        >
          {isSyncing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Sync Emails
            </>
          )}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Emails</CardTitle>
          <CardDescription>
            View all your incoming emails.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : emails.length > 0 ? (
            <EmailList emails={emails} setEmails={setEmails} />
          ) : (
            <div className="text-center py-8">
              <InboxIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No emails yet</h3>
              <p className="text-muted-foreground">
                Sync your emails to see them here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Inbox;
