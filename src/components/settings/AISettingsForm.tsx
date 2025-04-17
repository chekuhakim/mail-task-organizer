
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const aiSettingsSchema = z.object({
  processEmailBody: z.boolean().default(true),
  extractActionItems: z.boolean().default(true),
  markEmailAsRead: z.boolean().default(false),
});

export type AIFormValues = z.infer<typeof aiSettingsSchema>;

export const AISettingsForm = ({ defaultValues }: { defaultValues: AIFormValues }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const aiForm = useForm<AIFormValues>({
    resolver: zodResolver(aiSettingsSchema),
    defaultValues,
  });

  const saveAISettings = async (values: AIFormValues) => {
    if (!user) return;

    setIsSaving(true);
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
      setIsSaving(false);
    }
  };

  return (
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
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
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
  );
};
