"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { TagBadge } from "@/components/tag-badge";
import { Tag, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagPickerProps {
  projectId: string;
  /** IDs of tags currently attached to the project */
  attachedTagIds: string[];
  onAttach: (tagId: string) => void;
  onDetach: (tagId: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function TagPicker({ projectId: _projectId, attachedTagIds, onAttach, onDetach }: TagPickerProps) {
  const t = useTranslations("common.tags");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: allTags = [] } = api.tag.list.useQuery();

  const filteredTags = allTags.filter((tag) =>
    tag.name.toLowerCase().includes(search.toLowerCase()),
  );

  function handleToggle(tagId: string) {
    if (attachedTagIds.includes(tagId)) {
      onDetach(tagId);
    } else {
      onAttach(tagId);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
          <Tag className="h-3.5 w-3.5" />
          {t("addTag")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm mb-2"
          autoFocus
        />
        {filteredTags.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">{t("noTags")}</p>
        ) : (
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {filteredTags.map((tag) => {
              const isAttached = attachedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => handleToggle(tag.id)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors",
                  )}
                >
                  <TagBadge name={tag.name} color={tag.color} />
                  {isAttached && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Displays attached tags + the picker button inline */
export function ProjectTagsRow({ projectId }: { projectId: string }) {
  const t = useTranslations("common.tags");
  const utils = api.useUtils();

  const { data: projectTags = [] } = api.tag.listByProject.useQuery({ projectId });

  const attachMutation = api.tag.attachToProject.useMutation({
    onSuccess: () => void utils.tag.listByProject.invalidate({ projectId }),
    onError: () => toast.error(t("error")),
  });

  const detachMutation = api.tag.detachFromProject.useMutation({
    onSuccess: () => void utils.tag.listByProject.invalidate({ projectId }),
    onError: () => toast.error(t("error")),
  });

  const attachedIds = projectTags.map((t) => t.id);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {projectTags.map((tag) => (
        <TagBadge
          key={tag.id}
          name={tag.name}
          color={tag.color}
          onRemove={() => detachMutation.mutate({ tagId: tag.id, projectId })}
        />
      ))}
      <TagPicker
        projectId={projectId}
        attachedTagIds={attachedIds}
        onAttach={(tagId) => attachMutation.mutate({ tagId, projectId })}
        onDetach={(tagId) => detachMutation.mutate({ tagId, projectId })}
      />
    </div>
  );
}
