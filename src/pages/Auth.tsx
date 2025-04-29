
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type AuthMode = "login" | "signup";

const supabaseSettingsSchema = z.object({
  supabaseUrl: z.string().url("Please enter a valid URL").min(1, "Supabase URL is required"),
  supabaseKey: z.string().min(1, "Supabase Key is required"),
});

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const supabaseForm = useForm<z.infer<typeof supabaseSettingsSchema>>({
    resolver: zodResolver(supabaseSettingsSchema),
    defaultValues: {
      supabaseUrl: "",
      supabaseKey: "",
    },
  });

  const handleAuth = async (mode: AuthMode) => {
    setLoading(true);
    try {
      // First, validate and get Supabase settings
      let supabaseSettings = {};
      
      if (mode === "signup") {
        const formValues = supabaseForm.getValues();
        supabaseSettings = {
          supabase_url: formValues.supabaseUrl,
          supabase_key: formValues.supabaseKey
        };
        
        // Store in localStorage
        localStorage.setItem("supabase_url", formValues.supabaseUrl);
        localStorage.setItem("supabase_key", formValues.supabaseKey);
      }
      
      // Proceed with authentication
      if (mode === "signup") {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              ...supabaseSettings,
            },
          },
        });

        if (error) throw error;
        
        toast({
          title: "Account created!",
          description: "Please check your email for the confirmation link.",
        });

        // If we get user data back, sign up was automatic
        if (data.user) {
          // Insert Supabase settings
          await supabase.from("supabase_settings").insert({
            user_id: data.user.id,
            supabase_url: supabaseForm.getValues().supabaseUrl,
            supabase_key: supabaseForm.getValues().supabaseKey,
          });

          navigate("/");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome to MailTask</CardTitle>
          <CardDescription>
            AI-powered email processing and task management
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => handleAuth("login")}
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </CardFooter>
          </TabsContent>
          
          <TabsContent value="signup">
            <Form {...supabaseForm}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Supabase Configuration</p>
                  <p className="text-xs text-muted-foreground mb-4">Enter your Supabase project details</p>
                  
                  <FormField
                    control={supabaseForm.control}
                    name="supabaseUrl"
                    render={({ field }) => (
                      <FormItem className="mb-2">
                        <FormLabel className="text-xs">Supabase URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://your-project.supabase.co" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={supabaseForm.control}
                    name="supabaseKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Supabase Anon Key</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Your public/anon key" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handleAuth("signup")}
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </CardFooter>
            </Form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
