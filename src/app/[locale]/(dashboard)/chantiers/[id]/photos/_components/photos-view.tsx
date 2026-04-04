"use client";

import { useTranslations } from "next-intl";
import { useCallback, useRef, useState, useEffect } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { formatDate } from "@/lib/i18n-helpers";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Trash2, UploadCloud, X, ImagePlus, GripHorizontal, Mic, MicIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortablePhotoCard({ photo, locale, onDelete, onEditNote, isPending }: any) {
  const t = useTranslations("projects");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "overflow-hidden group relative border-transparent bg-muted/20 hover:border-border transition-colors cursor-pointer",
        isDragging && "opacity-40 border-primary"
      )}
      onClick={() => onEditNote(photo)}
    >
      <div className="aspect-square relative bg-muted/60">
        <Image
          src={photo.url}
          alt={photo.note ?? t("photos.photoAlt")}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover"
        />
        <div className="absolute inset-x-0 top-0 flex justify-between items-start p-2 opacity-0 bg-gradient-to-b from-black/60 to-transparent group-hover:opacity-100 transition-opacity">
          <div
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="cursor-move bg-black/40 p-1 rounded backdrop-blur-sm hover:bg-black/60 transition-colors"
          >
            <GripHorizontal className="h-4 w-4 text-white" />
          </div>
          <ConfirmDialog
            title={t("deleteConfirm.title")}
            description={t("deleteConfirm.description")}
            onConfirm={() => onDelete(photo.id)}
            trigger={
              <Button
                variant="destructive"
                size="icon"
                className="h-6 w-6 rounded-full opacity-80 hover:opacity-100 shadow-sm ml-2"
                onClick={(e) => e.stopPropagation()}
                disabled={isPending}
              >
                <X className="h-3 w-3" />
              </Button>
            }
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-2 pt-6 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end">
          {photo.note && (
            <p className="text-xs text-white line-clamp-2 leading-tight mb-1 font-medium drop-shadow-sm">{photo.note}</p>
          )}
          <span className="text-[10px] text-white/80 font-medium inline-block">
            {formatDate(new Date(photo.takenAt), locale)}
          </span>
        </div>
      </div>
    </Card>
  );
}

export function PhotosView({ projectId, locale }: { projectId: string; locale: string }) {
  const t = useTranslations("projects");
  const utils = api.useUtils();
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: serverPhotos, isLoading } = api.photo.listByProject.useQuery({ projectId });
  const [photos, setPhotos] = useState(serverPhotos || []);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Dialog state
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [editingNote, setEditingNote] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (serverPhotos) {
      setPhotos(serverPhotos);
    }
  }, [serverPhotos]);

  const updateNote = api.photo.updateNote.useMutation({
    onMutate: async (newInfo) => {
      // Optimistic update
      await utils.photo.listByProject.cancel({ projectId });
      const previousPhotos = utils.photo.listByProject.getData({ projectId });

      if (previousPhotos) {
        const updated = previousPhotos.map(p => 
          p.id === newInfo.id ? { ...p, note: newInfo.note } : p
        );
        utils.photo.listByProject.setData({ projectId }, updated);
        setPhotos(updated);
      }
      return { previousPhotos };
    },
    onError: (err, newInfo, context) => {
      toast.error("Erreur lors de la mise à jour de la note");
      if (context?.previousPhotos) {
        utils.photo.listByProject.setData({ projectId }, context.previousPhotos);
        setPhotos(context.previousPhotos);
      }
    },
    onSettled: () => {
      utils.photo.listByProject.invalidate({ projectId });
    }
  });

  const handleEditNoteStart = (photo: any) => {
    setSelectedPhoto(photo);
    setEditingNote(photo.note || "");
  };

  const saveNote = () => {
    if (selectedPhoto && selectedPhoto.note !== editingNote) {
      updateNote.mutate({ id: selectedPhoto.id, note: editingNote });
    }
    // Close dialog
    setSelectedPhoto(null);
    setIsRecording(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const toggleDictation = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("Dictée vocale non supportée sur ce navigateur");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = locale; // Use current locale for better dictation
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      setEditingNote(prev => prev + (prev.endsWith(" ") || prev === "" ? "" : " ") + finalTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    toast.success("À vous de parler...");
  };

  const updateOrder = api.photo.updateOrder.useMutation({
    onSuccess: () => {
      utils.photo.listByProject.invalidate({ projectId });
    },
    onError: () => {
      toast.error("Erreur lors de la sauvegarde de l'ordre");
      if (serverPhotos) setPhotos(serverPhotos); // revert on error
    }
  });

  const savePhoto = api.photo.save.useMutation({
    onSuccess: () => {
      utils.photo.listByProject.invalidate({ projectId });
    },
  });

  const deletePhoto = api.photo.delete.useMutation({
    onSuccess: () => {
      toast.success(t("toasts.deleted"));
      utils.photo.listByProject.invalidate({ projectId });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires 5px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPhotos((items: any) => {
        const oldIndex = items.findIndex((item: any) => item.id === active.id);
        const newIndex = items.findIndex((item: any) => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Save the new order
        updateOrder.mutate({
          projectId,
          orders: newItems.map((item: any, index: number) => ({ id: item.id, order: index }))
        });

        return newItems as any;
      });
    }
    setActiveId(null);
  };

  const handleDelete = (id: string) => {
    deletePhoto.mutate({ id });
  };

  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      // Validate: images only, max 8MB each
      const invalid = fileArray.filter(
        (f) => !f.type.startsWith("image/") || f.size > 8 * 1024 * 1024
      );
      if (invalid.length > 0) {
        toast.error("Fichiers invalides : images uniquement, max 8 Mo");
        return;
      }

      setUploading(true);
      setUploadProgress(10); // Start progress indicating compression phase

      try {
        const formData = new FormData();
        
        // Compression loop
        for (const file of fileArray) {
          try {
            const options = {
              maxSizeMB: 1.5,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
              fileType: "image/webp" as const,
              initialQuality: 0.85
            };
            const compressedFile = await imageCompression(file, options);
            formData.append("files", compressedFile);
          } catch (error) {
            console.warn("Erreur compression image, on utilise l'original", error);
            formData.append("files", file); // Fallback
          }
        }
        
        setUploadProgress(30); // Compression done, starting network upload

        const res = await fetch("/api/photos/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Upload échoué");
        }

        const { files: uploaded } = await res.json();

        for (const file of uploaded) {
          await savePhoto.mutateAsync({
            projectId,
            url: file.url,
            key: file.key,
          });
          setUploadProgress((p) => Math.min(100, p + Math.round(70 / uploaded.length)));
        }

        toast.success(t("photos.uploadSuccess", { count: uploaded.length }));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erreur d'upload";
        toast.error(message);
      } finally {
        setUploading(false);
        setUploadProgress(0);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [projectId, savePhoto, t]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleUpload(e.dataTransfer.files);
      }
    },
    [handleUpload]
  );

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all cursor-pointer",
          "flex flex-col items-center justify-center gap-3 p-10 md:p-14",
          "bg-muted/20 hover:bg-muted/40 hover:border-primary/50",
          dragOver && "border-primary bg-primary/5 scale-[1.01]",
          uploading && "pointer-events-none opacity-80"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
        />

        {uploading ? (
          <>
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm font-medium text-foreground">Envoi en cours...</p>
            {/* Progress bar */}
            <div className="w-full max-w-xs h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              {dragOver ? (
                <ImagePlus className="h-7 w-7 text-primary" />
              ) : (
                <UploadCloud className="h-7 w-7 text-primary" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                {dragOver ? "Déposez vos photos ici" : "Glissez vos photos ici"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ou <span className="text-primary font-medium underline underline-offset-2">cliquez pour sélectionner</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">JPG, PNG, WEBP — max 8 Mo par photo — jusqu'à 10 fichiers</p>
            </div>
          </>
        )}
      </div>

      {/* Photo Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 animate-in fade-in duration-500">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-xl bg-muted/60" />
          ))}
        </div>
      ) : photos && photos.length > 0 ? (
        <div className="animate-in fade-in duration-500">
          <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={photos} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {photos.map((photo: any) => (
                <SortablePhotoCard
                  key={photo.id}
                  photo={photo}
                  locale={locale}
                  onDelete={handleDelete}
                  onEditNote={handleEditNoteStart}
                  isPending={deletePhoto.isPending}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <SortablePhotoCard
                photo={photos.find((p: any) => p.id === activeId)}
                locale={locale}
                onDelete={() => {}}
                onEditNote={() => {}}
                isPending={false}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-12 text-center animate-in fade-in duration-500">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2">
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">{t("photos.empty")}</p>
          <p className="text-xs text-muted-foreground">Ajoutez vos premières photos via la zone ci-dessus</p>
        </div>
      )}

      {/* Editor Dialog */}
      <Dialog 
        open={selectedPhoto !== null} 
        onOpenChange={(open) => {
          if (!open) saveNote();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Détails de la photo</DialogTitle>
          </DialogHeader>

          {selectedPhoto && (
            <div className="space-y-4">
              <div className="aspect-video relative rounded-lg overflow-hidden bg-muted flex items-center justify-center group">
                <Image
                  src={selectedPhoto.url}
                  alt={selectedPhoto.note ?? "Photo preview"}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="space-y-2 relative">
              <p className="text-sm font-medium">Légende (dictée vocale disponible)</p>
                <div className="relative">
                  <Input
                    placeholder="Ex: Fissure dans le mur nord"
                    className="pr-12 bg-muted/30 max-h-[80px]"
                    value={editingNote}
                    onChange={(e) => setEditingNote(e.target.value)}
                  />
                  <Button
                    size="icon"
                    type="button"
                    variant={isRecording ? "destructive" : "ghost"}
                    onClick={toggleDictation}
                    className={cn(
                      "absolute right-1 top-1 h-8 w-8",
                      isRecording && "animate-pulse"
                    )}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={saveNote}>Enregistrer</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
