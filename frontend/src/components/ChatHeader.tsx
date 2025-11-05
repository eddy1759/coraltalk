import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bot, Brain } from 'lucide-react';

interface ChatHeaderProps {
  useGeneralLLM: boolean;
  onToggleLLM: (enabled: boolean) => void;
}

export const ChatHeader = ({ useGeneralLLM, onToggleLLM }: ChatHeaderProps) => {
  return (
    <div className="border-b border-border bg-card p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Bot className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">CoralTalk Bot</h1>
          <p className="text-xs text-muted-foreground">
            {useGeneralLLM ? 'General LLM + Knowledge Base' : 'Knowledge Base Only'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Label htmlFor="llm-mode" className="text-sm flex items-center gap-2 cursor-pointer">
          <Brain className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Use General LLM</span>
        </Label>
        <Switch
          id="llm-mode"
          checked={useGeneralLLM}
          onCheckedChange={onToggleLLM}
        />
      </div>
    </div>
  );
};