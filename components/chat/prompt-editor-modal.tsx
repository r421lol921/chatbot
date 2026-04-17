"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const STORAGE_KEY = "lio-custom-prompt";

// Default additional prompt hints for users
const defaultCustomPrompt = "";

export function useCustomPrompt() {
  const [customPrompt, setCustomPrompt] = useState<string>("");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setCustomPrompt(stored);
    }
  }, []);

  const saveCustomPrompt = (prompt: string) => {
    setCustomPrompt(prompt);
    localStorage.setItem(STORAGE_KEY, prompt);
  };

  const clearCustomPrompt = () => {
    setCustomPrompt("");
    localStorage.removeItem(STORAGE_KEY);
  };

  return { customPrompt, saveCustomPrompt, clearCustomPrompt };
}

interface PromptEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PromptEditorModal({ open, onOpenChange }: PromptEditorModalProps) {
  const { customPrompt, saveCustomPrompt, clearCustomPrompt } = useCustomPrompt();
  const [localPrompt, setLocalPrompt] = useState(customPrompt);

  useEffect(() => {
    if (open) {
      setLocalPrompt(customPrompt);
    }
  }, [open, customPrompt]);

  const handleSave = () => {
    saveCustomPrompt(localPrompt);
    onOpenChange(false);
  };

  const handleReset = () => {
    clearCustomPrompt();
    setLocalPrompt("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Customize Lio&apos;s Prompt</DialogTitle>
          <DialogDescription>
            Add your own instructions to customize how Lio responds. Lio will always stay in character as Lio 1.0 by PeytOtoria.com.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Textarea
            placeholder="Example: Always respond in Spanish. Focus on coding help. Be extra concise. Use a sarcastic tone..."
            value={localPrompt}
            onChange={(e) => setLocalPrompt(e.target.value)}
            className="min-h-[150px] resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Note: Core identity (Lio 1.0 by PeytOtoria.com) cannot be overwritten.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleReset}>
            Reset to Default
          </Button>
          <Button onClick={handleSave}>
            Save Prompt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
