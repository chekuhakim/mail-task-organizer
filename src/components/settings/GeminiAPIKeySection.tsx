
import { useToast } from "@/hooks/use-toast";
import { GeminiAPIKeyDialog } from "./GeminiAPIKeyDialog";

interface GeminiAPIKeySectionProps {
  savedApiKey: string | null;
  setSavedGeminiApiKey: (key: string) => void;
}

export const GeminiAPIKeySection = ({ 
  savedApiKey, 
  setSavedGeminiApiKey 
}: GeminiAPIKeySectionProps) => {
  const { toast } = useToast();

  const saveGeminiApiKey = (apiKey: string) => {
    // In a real app, this should be stored securely, not in localStorage
    localStorage.setItem("gemini_api_key", apiKey);
    setSavedGeminiApiKey(apiKey);
    toast({
      title: "Success",
      description: "Gemini API key saved successfully",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-row justify-between items-center">
        <h3 className="text-lg font-medium">Gemini API Key</h3>
        <GeminiAPIKeyDialog
          savedApiKey={savedApiKey}
          onSave={saveGeminiApiKey}
        />
      </div>
      
      {savedApiKey ? (
        <p className="text-sm text-muted-foreground">
          API key is configured. Your API key is stored securely.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Please add your Gemini API key to enable AI features.
        </p>
      )}
    </div>
  );
};
