
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const supabaseSettingsSchema = z.object({
  supabaseUrl: z.string().url("Please enter a valid URL"),
  supabaseKey: z.string().min(1, "API key is required"),
});

export type SupabaseFormValues = z.infer<typeof supabaseSettingsSchema>;

export const SupabaseSettingsForm = ({ defaultValues }: { defaultValues: SupabaseFormValues }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const supabaseForm = useForm<SupabaseFormValues>({
    resolver: zodResolver(supabaseSettingsSchema),
    defaultValues,
  });

  const saveSupabaseSettings = async (values: SupabaseFormValues) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from("supabase_settings").upsert({
        user_id: user.id,
        supabase_url: values.supabaseUrl,
        supabase_key: values.supabaseKey,
      });

      if (error) throw error;

      // Also store in localStorage for immediate access
      localStorage.setItem("supabase_url", values.supabaseUrl);
      localStorage.setItem("supabase_key", values.supabaseKey);

      toast({
        title: "Success",
        description: "Supabase settings saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save Supabase settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...supabaseForm}>
      <form onSubmit={supabaseForm.handleSubmit(saveSupabaseSettings)} className="space-y-4">
        <FormField
          control={supabaseForm.control}
          name="supabaseUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supabase URL</FormLabel>
              <FormControl>
                <Input placeholder="https://your-project.supabase.co" {...field} />
              </FormControl>
              <FormDescription>
                The URL of your Supabase project
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={supabaseForm.control}
          name="supabaseKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supabase Anon Key</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Your Supabase anon key" {...field} />
              </FormControl>
              <FormDescription>
                The anon/public API key of your Supabase project
              </FormDescription>
              <FormMessage />
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
              "Save Supabase Settings"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
