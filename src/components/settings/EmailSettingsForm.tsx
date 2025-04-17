
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { testEmailConnection } from "@/lib/emailClient";
import { EmailSettings } from "@/types";
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

export type EmailFormValues = z.infer<typeof emailSettingsSchema>;

export const EmailSettingsForm = ({ defaultValues }: { defaultValues: EmailFormValues }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues,
  });

  const saveEmailSettings = async (values: EmailFormValues) => {
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

  return (
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
  );
};
