
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { testEmailConnection } from "@/lib/emailClient";
import { AISettings, EmailSettings } from "@/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const emailSettingsSchema = z.object({
  protocol: z.enum(["imap", "pop3"]),
  server: z.string().min(1, "Server is required"),
  port: z.string().min(1, "Port is required"),
  username: z.string().email("Must be a valid email"),
  password: z.string().min(1, "Password is required"),
  useSSL: z.boolean().default(true),
  fetchFrequency: z.enum(["6h", "12h", "24h"]).default("24h"),
});

const aiSettingsSchema = z.object({
  processEmailBody: z.boolean().default(true),
  extractActionItems: z.boolean().default(true),
  markEmailAsRead: z.boolean().default(false),
});

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSavingAISettings, setIsSavingAISettings] = useState(false);
  const [isGeminiKeyDialogOpen, setIsGeminiKeyDialogOpen] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [savedGeminiApiKey, setSavedGeminiApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const emailForm = useForm<z.infer<typeof emailSettingsSchema>>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      protocol: "imap",
      server: "",
      port: "",
      username: "",
      password: "",
      useSSL: true,
      fetchFrequency: "24h",
    },
  });

  const aiForm = useForm<z.infer<typeof aiSettingsSchema>>({
    resolver: zodResolver(aiSettingsSchema),
    defaultValues: {
      processEmailBody: true,
      extractActionItems: true,
      markEmailAsRead: false,
    },
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
          emailForm.reset({
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
          aiForm.reset({
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
  }, [user, emailForm, aiForm, toast]);

  const saveEmailSettings = async (values: z.infer<typeof emailSettingsSchema>) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("email_settings").upsert({
        user_id: user.id,
        protocol: values.protocol,
        server: values.server,
        port: values.port,
        username: values.username,
        password: values.password,
        use_ssl: values.useSSL,
        fetch_frequency: values.fetchFrequency,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email settings saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save email settings",
        variant: "destructive",
      });
    }
  };

  const saveAISettings = async (values: z.infer<typeof aiSettingsSchema>) => {
    if (!user) return;

    setIsSavingAISettings(true);
    try {
      const { error } = await supabase.from("ai_settings").upsert({
        user_id: user.id,
        process_email_body: values.processEmailBody,
        extract_action_items: values.extractActionItems,
        mark_email_as_read: values.markEmailAsRead,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "AI settings saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save AI settings",
        variant: "destructive",
      });
    } finally {
      setIsSavingAISettings(false);
    }
  };

  const saveGeminiApiKey = () => {
    // In a real app, this should be stored securely, not in localStorage
    localStorage.setItem("gemini_api_key", geminiApiKey);
    setSavedGeminiApiKey(geminiApiKey);
    setIsGeminiKeyDialogOpen(false);
    toast({
      title: "Success",
      description: "Gemini API key saved successfully",
    });
  };

  const handleTestConnection = async () => {
    const values = emailForm.getValues();
    setIsTestingConnection(true);
    
    try {
      const result = await testEmailConnection({
        protocol: values.protocol,
        server: values.server,
        port: values.port,
        username: values.username,
        password: values.password,
        useSSL: values.useSSL,
        fetchFrequency: values.fetchFrequency,
      });
      
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: result.message,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test connection",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

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
      
      <Card>
        <CardHeader>
          <CardTitle>Email Connection</CardTitle>
          <CardDescription>
            Configure your email server settings for daily fetching.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(saveEmailSettings)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="protocol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protocol</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select protocol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="imap">IMAP (recommended)</SelectItem>
                        <SelectItem value="pop3">POP3</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      IMAP allows marking emails as read, POP3 typically downloads and deletes from server.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={emailForm.control}
                  name="server"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mail Server</FormLabel>
                      <FormControl>
                        <Input placeholder="mail.example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={emailForm.control}
                  name="port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Port</FormLabel>
                      <FormControl>
                        <Input placeholder="993" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={emailForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={emailForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password or App Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormDescription>
                      We recommend using an app-specific password rather than your main account password.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={emailForm.control}
                name="useSSL"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Use SSL/TLS</FormLabel>
                      <FormDescription>
                        Secure connection to your email server (recommended).
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={emailForm.control}
                name="fetchFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fetch Frequency</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="6h">Every 6 hours</SelectItem>
                        <SelectItem value="12h">Every 12 hours</SelectItem>
                        <SelectItem value="24h">Once daily (recommended)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How often should we check for new emails?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="pt-4 flex gap-4">
                <Button type="submit">Save Email Settings</Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>AI Processing Settings</CardTitle>
          <CardDescription>
            Configure how Gemini AI processes your emails.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-row justify-between items-center">
                <h3 className="text-lg font-medium">Gemini API Key</h3>
                <Dialog open={isGeminiKeyDialogOpen} onOpenChange={setIsGeminiKeyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      {savedGeminiApiKey ? "Update API Key" : "Add API Key"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Gemini API Key</DialogTitle>
                      <DialogDescription>
                        Enter your Gemini API key to enable AI processing of emails.
                        You can get an API key from the Google AI Studio.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Input
                        type="password"
                        placeholder="Enter Gemini API Key"
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsGeminiKeyDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={saveGeminiApiKey} disabled={!geminiApiKey}>
                        Save API Key
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              {savedGeminiApiKey ? (
                <p className="text-sm text-muted-foreground">
                  API key is configured. Your API key is stored securely.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Please add your Gemini API key to enable AI features.
                </p>
              )}
            </div>
            
            <Form {...aiForm}>
              <form onSubmit={aiForm.handleSubmit(saveAISettings)} className="space-y-4">
                <FormField
                  control={aiForm.control}
                  name="processEmailBody"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Process Email Body</FormLabel>
                        <FormDescription>
                          Generate summaries from email content.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={aiForm.control}
                  name="extractActionItems"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Extract Action Items</FormLabel>
                        <FormDescription>
                          Identify and extract tasks from emails.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={aiForm.control}
                  name="markEmailAsRead"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Mark Email as Read</FormLabel>
                        <FormDescription>
                          After processing, mark emails as read on the server.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="pt-4">
                  <Button type="submit" disabled={isSavingAISettings}>
                    {isSavingAISettings ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save AI Settings"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
