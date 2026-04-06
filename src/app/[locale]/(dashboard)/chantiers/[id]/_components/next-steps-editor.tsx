"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  ListTodo
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type NextStep = {
  text: string;
  done: boolean;
};

interface NextStepsEditorProps {
  projectId: string;
  initialSteps: NextStep[];
  translations: {
    title: string;
    placeholder: string;
    saveSuccess: string;
  };
}

export function NextStepsEditor({ projectId, initialSteps, translations }: NextStepsEditorProps) {
  const router = useRouter();
  const [steps, setSteps] = useState<NextStep[]>(initialSteps || []);
  const [newStep, setNewStep] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // tRPC mutation pour mettre à jour
  const updateMutation = api.project.update.useMutation({
    onSuccess: () => {
      toast.success(translations.saveSuccess);
      router.refresh();
      setIsSaving(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setIsSaving(false);
    }
  });

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStep.trim()) return;
    
    const updated = [...steps, { text: newStep.trim(), done: false }];
    setSteps(updated);
    setNewStep("");
    saveSteps(updated);
  };

  const toggleStep = (index: number) => {
    const updated = steps.map((s, i) => 
      i === index ? { ...s, done: !s.done } : s
    );
    setSteps(updated);
    saveSteps(updated);
  };

  const removeStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index);
    setSteps(updated);
    saveSteps(updated);
  };

  const saveSteps = (updatedSteps: NextStep[]) => {
    setIsSaving(true);
    updateMutation.mutate({
      id: projectId,
      nextSteps: updatedSteps as NextStep[],
    });
  };

  return (
    <Card className="shadow-none border-primary/15 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-5">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg icon-primary flex items-center justify-center shrink-0">
              <ListTodo className="h-3.5 w-3.5" />
            </div>
            {translations.title}
          </div>
          {isSaving && <span className="text-[10px] text-primary animate-pulse uppercase font-bold tracking-tighter">Sincro...</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-4">
        {/* Progress bar light */}
        {steps.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Progression client</span>
              <span>{Math.round((steps.filter(s => s.done).length / steps.length) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${(steps.filter(s => s.done).length / steps.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          {steps.map((step, idx) => (
            <div 
              key={idx} 
              className={cn(
                "group flex items-center gap-3 p-2.5 rounded-xl border border-border/50 bg-background/50 hover:bg-background transition-all",
                step.done && "opacity-60 bg-muted/30"
              )}
            >
              <button 
                onClick={() => toggleStep(idx)}
                className="shrink-0 transition-transform active:scale-90"
              >
                {step.done ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-500/10" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/30 hover:text-primary transition-colors" />
                )}
              </button>
              
              <span className={cn(
                "text-sm flex-1 font-medium transition-all",
                step.done && "line-through text-muted-foreground"
              )}>
                {step.text}
              </span>

              <button 
                onClick={() => removeStep(idx)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddStep} className="flex gap-2">
          <Input
            value={newStep}
            onChange={(e) => setNewStep(e.target.value)}
            placeholder={translations.placeholder}
            className="h-10 text-sm rounded-xl border-dashed bg-transparent hover:bg-background transition-colors focus-visible:ring-primary/20"
          />
          <Button type="submit" size="icon" className="h-10 w-10 shrink-0 rounded-xl shadow-sm">
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
