
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Inbox as InboxIcon, Loader } from "lucide-react";
import { EmailList } from "@/components/email/EmailList";
import { useToast } from "@/hooks/use-toast";
import { Email } from "@/types";
import { useSearch } from "@/context/SearchContext";

const Inbox = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { search } = useSearch();
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const filteredEmails = search
    ? emails.filter(email => (
        email.subject.toLowerCase().includes(search.toLowerCase()) ||
        email.sender.name.toLowerCase().includes(search.toLowerCase()) ||
        email.sender.email.toLowerCase().includes(search.toLowerCase()) ||
        email.body?.toLowerCase().includes(search.toLowerCase()) ||
        email.summary?.toLowerCase().includes(search.toLowerCase())
      ))
    : emails;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
        <p className="text-muted-foreground">View and manage your emails.</p>
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
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredEmails.length > 0 ? (
            <EmailList emails={filteredEmails} setEmails={setEmails} />
          ) : (
            <div className="text-center py-8">
              <InboxIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No emails found</h3>
              <p className="text-muted-foreground">
                {search ? "No results match your search." : "Sync your emails to see them here"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Inbox;
