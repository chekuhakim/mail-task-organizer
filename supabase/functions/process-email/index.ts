
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.26.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailToProcess {
  emailId: string;
  subject: string;
  body: string;
  senderName: string;
  senderEmail: string;
  receivedAt: string;
}

interface ProcessingResult {
  summary: string;
  tasks: {
    description: string;
    priority: "low" | "medium" | "high";
  }[];
}

// Mock function to simulate AI processing - in a real app this would call the Gemini API
async function processWithAI(email: EmailToProcess): Promise<ProcessingResult> {
  // In a real implementation, this would call the Gemini API
  console.log("Processing email with AI:", email.subject);
  
  // For now, return mock data
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing time
  
  return {
    summary: `This is an AI-generated summary of "${email.subject}". The email contains information from ${email.senderName} that would normally be processed by Gemini AI.`,
    tasks: [
      {
        description: `Review information about "${email.subject}"`,
        priority: "medium",
      },
      {
        description: `Follow up with ${email.senderName}`,
        priority: "high",
      }
    ]
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userId, apiKey } = await req.json();
    
    if (!email || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://rytpbfpgkswojbsyankv.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || req.headers.get("Authorization")?.split("Bearer ")[1] || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process the email with AI
    const result = await processWithAI({
      emailId: email.id,
      subject: email.subject,
      body: email.body,
      senderName: email.senderName,
      senderEmail: email.senderEmail,
      receivedAt: email.receivedAt,
    });

    // Store the email in the database
    const { data: emailData, error: emailError } = await supabase
      .from("emails")
      .upsert({
        user_id: userId,
        email_id: email.id,
        subject: email.subject,
        sender_name: email.senderName,
        sender_email: email.senderEmail,
        received_at: email.receivedAt,
        body: email.body,
        summary: result.summary,
      })
      .select("id")
      .single();

    if (emailError) {
      throw new Error(`Error storing email: ${emailError.message}`);
    }

    // Store the extracted tasks
    const tasksToInsert = result.tasks.map(task => ({
      user_id: userId,
      email_id: emailData.id,
      description: task.description,
      priority: task.priority,
    }));

    const { error: tasksError } = await supabase
      .from("tasks")
      .insert(tasksToInsert);

    if (tasksError) {
      throw new Error(`Error storing tasks: ${tasksError.message}`);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        result: {
          summary: result.summary,
          tasks: result.tasks,
        },
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in process-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
