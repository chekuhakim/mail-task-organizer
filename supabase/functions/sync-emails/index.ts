
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.26.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailSettings {
  protocol: "imap" | "pop3";
  server: string;
  port: string;
  username: string;
  password: string;
  useSSL: boolean;
  fetchFrequency: string;
}

// Mock function to simulate fetching emails from an IMAP/POP3 server
async function fetchEmailsFromServer(settings: EmailSettings) {
  console.log("Fetching emails with settings:", settings);
  
  // In a real implementation, this would use an IMAP/POP3 library
  // For now, return mock data
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
  
  return [
    {
      id: "email1",
      subject: "Important Project Update",
      senderName: "John Smith",
      senderEmail: "john.smith@example.com",
      receivedAt: new Date().toISOString(),
      body: "Dear team, please find attached the latest project update. We need to discuss this at our next meeting.",
    },
    {
      id: "email2",
      subject: "Meeting Reminder",
      senderName: "Alice Johnson",
      senderEmail: "alice.j@example.com",
      receivedAt: new Date().toISOString(),
      body: "This is a reminder about our meeting tomorrow at 10:00 AM. Please prepare your progress reports.",
    },
  ];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://rytpbfpgkswojbsyankv.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's email settings
    const { data: emailSettings, error: settingsError } = await supabase
      .from("email_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (settingsError) {
      return new Response(
        JSON.stringify({ error: "Email settings not found", details: settingsError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch emails from server
    const emails = await fetchEmailsFromServer({
      protocol: emailSettings.protocol,
      server: emailSettings.server,
      port: emailSettings.port,
      username: emailSettings.username,
      password: emailSettings.password,
      useSSL: emailSettings.use_ssl,
      fetchFrequency: emailSettings.fetch_frequency,
    });

    // Process and store emails
    const processResults = await Promise.all(
      emails.map(async (email) => {
        try {
          // Check if email already exists
          const { data: existingEmail } = await supabase
            .from("emails")
            .select("id")
            .eq("user_id", userId)
            .eq("email_id", email.id)
            .maybeSingle();

          if (existingEmail) {
            return { status: "skipped", email: email.id, message: "Email already exists" };
          }

          // In a real implementation, we would use process-email to analyze the email
          // For now, let's create a simple summary
          const summary = `This is an email about ${email.subject} from ${email.senderName}.`;

          // Insert the email
          const { data: insertedEmail, error: insertError } = await supabase
            .from("emails")
            .insert({
              user_id: userId,
              email_id: email.id,
              subject: email.subject,
              sender_name: email.senderName,
              sender_email: email.senderEmail,
              received_at: email.receivedAt,
              body: email.body,
              summary: summary,
            })
            .select()
            .single();

          if (insertError) {
            throw new Error(`Error inserting email: ${insertError.message}`);
          }

          // Create a mock task for the email
          const { error: taskError } = await supabase
            .from("tasks")
            .insert({
              user_id: userId,
              email_id: insertedEmail.id,
              description: `Follow up on email: ${email.subject}`,
              priority: "medium",
              due_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            });

          if (taskError) {
            console.error("Error creating task:", taskError);
          }

          return { status: "success", email: email.id, emailId: insertedEmail.id };
        } catch (error) {
          console.error("Error processing email:", error);
          return { status: "error", email: email.id, error: error.message };
        }
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        processedEmails: processResults.filter(r => r.status === "success").length,
        results: processResults,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("Error in sync-emails function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
