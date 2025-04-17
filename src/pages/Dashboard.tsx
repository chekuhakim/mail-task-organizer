
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, Mail } from "lucide-react";
import { EmailList } from "@/components/email/EmailList";
import { TaskList } from "@/components/tasks/TaskList";
import { StatsCards } from "@/components/dashboard/StatsCards";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">View your daily email summaries and tasks.</p>
      </div>
      
      <StatsCards />
      
      <Tabs defaultValue="emails" className="space-y-4">
        <TabsList>
          <TabsTrigger value="emails" className="flex items-center">
            <Mail className="mr-2 h-4 w-4" />
            Emails
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center">
            <CheckCircle className="mr-2 h-4 w-4" />
            Tasks
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="emails" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Email Summaries</CardTitle>
              <CardDescription>
                AI-generated summaries of your recent emails.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmailList />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task List</CardTitle>
              <CardDescription>
                Tasks extracted from your emails.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TaskList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
