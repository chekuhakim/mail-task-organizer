
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { AISettingsForm, AIFormValues } from "@/components/settings/AISettingsForm";
import { SupabaseSettingsForm, SupabaseFormValues } from "@/components/settings/SupabaseSettingsForm";

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [supabaseSettings, setSupabaseSettings] = useState<SupabaseFormValues>({
    supabaseUrl: "",
    supabaseKey: "",
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
        // Load Supabase settings
        const { data: supabaseSettingsData, error: supabaseError } = await supabase
          .from("supabase_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (supabaseError && supabaseError.code !== "PGRST116") {
          console.error("Error loading Supabase settings:", supabaseError);
          toast({
            title: "Error",
            description: "Failed to load Supabase settings",
            variant: "destructive",
          });
        }

        if (supabaseSettingsData) {
          setSupabaseSettings({
            supabaseUrl: supabaseSettingsData.supabase_url,
            supabaseKey: supabaseSettingsData.supabase_key,
          });

          // Store in localStorage for immediate access
          localStorage.setItem("supabase_url", supabaseSettingsData.supabase_url);
          localStorage.setItem("supabase_key", supabaseSettingsData.supabase_key);
        } else {
          // Check localStorage for existing settings
          const storedUrl = localStorage.getItem("supabase_url");
          const storedKey = localStorage.getItem("supabase_key");
          
          if (storedUrl && storedKey) {
            setSupabaseSettings({
              supabaseUrl: storedUrl,
              supabaseKey: storedKey,
            });
          }
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
        <p className="text-muted-foreground">Configure your Supabase and AI settings.</p>
      </div>
      
      <SettingsCard 
        title="Supabase Configuration" 
        description="Configure your Supabase settings for your application."
      >
        <SupabaseSettingsForm defaultValues={supabaseSettings} />
      </SettingsCard>
      
      <SettingsCard 
        title="AI Processing Settings" 
        description="Configure how AI processes your data."
      >
        <AISettingsForm defaultValues={aiSettings} />
      </SettingsCard>
    </div>
  );
};

export default Settings;
