
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Eye, Star, StarOff, Trash } from "lucide-react";
import { useState } from "react";
import { Email } from "@/types";
import { mockEmails, formatDate, getInitials } from "@/lib/mockData";

export const EmailList = () => {
  const [emails, setEmails] = useState<Email[]>(mockEmails);

  const toggleRead = (id: string) => {
    setEmails(emails.map(email => 
      email.id === id ? { ...email, read: !email.read } : email
    ));
  };

  const toggleStar = (id: string) => {
    setEmails(emails.map(email => 
      email.id === id ? { ...email, starred: !email.starred } : email
    ));
  };

  return (
    <div className="space-y-1">
      {emails.map((email, index) => (
        <div key={email.id}>
          <div className={`p-3 rounded-md flex items-start gap-4 hover:bg-muted/50 ${!email.read ? 'bg-blue-50' : ''}`}>
            <div className="flex items-center gap-2">
              <Checkbox id={`select-${email.id}`} />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => toggleStar(email.id)}
              >
                {email.starred ? 
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> : 
                  <StarOff className="h-4 w-4 text-muted-foreground" />
                }
              </Button>
            </div>

            <Avatar className="h-8 w-8">
              <AvatarImage src={email.sender.avatar} alt={email.sender.name} />
              <AvatarFallback>{getInitials(email.sender.name)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div className="font-medium truncate pr-4">
                  {email.subject}
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(email.receivedAt)}
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                <span className="font-medium">{email.sender.name}</span>
                {" - "}
                {email.summary.length > 120 ? 
                  `${email.summary.substring(0, 120)}...` : 
                  email.summary
                }
              </div>
              <div className="mt-2 flex items-center gap-2">
                {email.tasks > 0 && (
                  <Badge variant="outline" className="text-xs bg-task-light text-task">
                    {email.tasks} {email.tasks === 1 ? 'task' : 'tasks'}
                  </Badge>
                )}
                {!email.read && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600">
                    Unread
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => toggleRead(email.id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {index < emails.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  );
};
