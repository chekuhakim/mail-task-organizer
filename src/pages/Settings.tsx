
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { EmailSettingsForm, EmailFormValues } from "@/components/settings/EmailSettingsForm";
import { AISettingsForm, AIFormValues } from "@/components/settings/AISettingsForm";
import { GeminiAPIKeySection } from "@/components/settings/GeminiAPIKeySection";

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedGeminiApiKey, setSavedGeminiApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [emailSettings, setEmailSettings] = useState<EmailFormValues>({
    protocol: "imap",
    server: "",
    port: "",
    username: "",
    password: "",
    useSSL: true,
    fetchFrequency: "24h",
  });
  const [aiSettings, setAiSettings] = useState<AIFormValues>({
    processEmailBody: true,
    extractActionItems: true,
    markEmailAsRead: false,
  });

  // Load user settings from Supabase
  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      try {
        // Load email settings
        const { data: emailSettingsData, error: emailError } = await supabase
          .from("email_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (emailError && emailError.code !== "PGRST116") {
          console.error("Error loading email settings:", emailError);
          toast({
            title: "Error",
            description: "Failed to load email settings",
            variant: "destructive",
          });
        }

        if (emailSettingsData) {
          setEmailSettings({
            protocol: emailSettingsData.protocol as "imap" | "pop3",
            server: emailSettingsData.server,
            port: emailSettingsData.port,
            username: emailSettingsData.username,
            password: emailSettingsData.password,
            useSSL: emailSettingsData.use_ssl,
            fetchFrequency: emailSettingsData.fetch_frequency as "6h" | "12h" | "24h",
          });
        }

        // Load AI settings
        const { data: aiSettingsData, error: aiError } = await supabase
          .from("ai_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (aiError && aiError.code !== "PGRST116") {
          console.error("Error loading AI settings:", aiError);
          toast({
            title: "Error",
            description: "Failed to load AI settings",
            variant: "destructive",
          });
        }

        if (aiSettingsData) {
          setAiSettings({
            processEmailBody: aiSettingsData.process_email_body || true,
            extractActionItems: aiSettingsData.extract_action_items || true,
            markEmailAsRead: aiSettingsData.mark_email_as_read || false,
          });
        }

        // Check if Gemini API key exists
        // In a real app, this would be stored securely, not in localStorage
        const storedApiKey = localStorage.getItem("gemini_api_key");
        setSavedGeminiApiKey(storedApiKey);

        setIsLoading(false);
      } catch (err) {
        console.error("Error in loading settings:", err);
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your email and AI settings.</p>
      </div>
      
      <SettingsCard 
        title="Email Connection" 
        description="Configure your email server settings for daily fetching."
      >
        <EmailSettingsForm defaultValues={emailSettings} />
      </SettingsCard>
      
      <SettingsCard 
        title="AI Processing Settings" 
        description="Configure how Gemini AI processes your emails."
      >
        <div className="space-y-6">
          <GeminiAPIKeySection 
            savedApiKey={savedGeminiApiKey}
            setSavedGeminiApiKey={setSavedGeminiApiKey}
          />
          
          <AISettingsForm defaultValues={aiSettings} />
        </div>
      </SettingsCard>
    </div>
  );
};

export default Settings;
