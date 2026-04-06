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
import { Loader2, Trash2, X, ImagePlus, GripHorizontal, Mic } from "lucide-react";
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
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] text-white/80 font-medium inline-block">
              {formatDate(new Date(photo.takenAt), locale)}
            </span>
            {photo.createdBy?.name && (
              <span className="text-[10px] text-white/60 italic truncate max-w-[60%] text-right">
                {t("photos.addedBy", { name: photo.createdBy.name })}
              </span>
            )}
          </div>
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
            <div className={cn("transition-transform duration-200", dragOver && "scale-110")}>
              <svg width="100" height="97" viewBox="0 0 166 161" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <g filter="url(#pv_f0)">
                  <g clipPath="url(#pv_c0)">
                    <rect x="53.3732" y="5" width="106" height="99" rx="9" transform="rotate(15 53.3732 5)" fill="white"/>
                    <path d="M60.9712 7.55352L147.905 30.8472C151.906 31.9193 154.28 36.0318 153.208 40.0328L131.726 120.205C130.654 124.206 126.541 126.58 122.54 125.508L35.607 102.214C31.606 101.142 29.2316 97.0297 30.3037 93.0287L51.7856 12.8568C52.8577 8.85582 56.9702 6.48145 60.9712 7.55352Z" stroke="#C4C8CF"/>
                    <path d="M31.3043 91.2262C30.7325 93.3601 31.9988 95.5534 34.1327 96.1252L126.862 120.972C128.995 121.544 131.189 120.277 131.761 118.143L131.243 120.075C130.242 123.81 126.404 126.026 122.67 125.025L35.7364 101.731C32.0021 100.731 29.786 96.8923 30.7866 93.1581L31.3043 91.2262Z" fill="#EAEDF6"/>
                    <rect x="56.9088" y="11.1237" width="96" height="84" rx="4" transform="rotate(15 56.9088 11.1237)" fill="url(#pv_p0)" fillOpacity="0.5"/>
                    <path d="M127.17 74.8327L134.367 92.96L128.932 113.244C128.36 115.378 126.167 116.645 124.033 116.073L93.6065 107.92L100.077 83.7719L118.344 72.0031C121.52 69.9565 125.775 71.3206 127.17 74.8327Z" fill="url(#pv_p1)" fillOpacity="0.5"/>
                    <path d="M83.4972 47.1751L39.2277 81.7759C38.2014 82.578 37.4641 83.6922 37.127 84.9503L36.2032 88.3978C35.6315 90.5317 36.8978 92.725 39.0317 93.2968L112.442 112.967L92.922 50.1227C91.6767 46.1135 86.8048 44.5899 83.4972 47.1751Z" fill="url(#pv_p2)"/>
                    <circle cx="118.899" cy="46.3689" r="11" transform="rotate(15 118.899 46.3689)" fill="white" filter="url(#pv_f1)"/>
                    <rect x="53.3732" y="5" width="106" height="99" transform="rotate(15 53.3732 5)" fill="white" fillOpacity="0.7"/>
                  </g>
                </g>
                <g filter="url(#pv_f2)">
                  <g clipPath="url(#pv_c1)">
                    <rect x="10" y="20.9833" width="106" height="99" rx="9" transform="rotate(-7.15156 10 20.9833)" fill="white"/>
                    <path d="M18 20.4835L107.3 9.27897C111.41 8.76329 115.16 11.677 115.675 15.7869L126.008 98.1412C126.524 102.251 123.61 106.001 119.5 106.517L30.2005 117.721C26.0906 118.237 22.3408 115.323 21.8251 111.213L11.4921 28.8588C10.9764 24.7489 13.8901 20.9991 18 20.4835Z" stroke="#C4C8CF"/>
                    <path d="M22.0722 109.166C22.3472 111.358 24.3471 112.912 26.5391 112.637L121.792 100.686C123.984 100.411 125.538 98.4109 125.263 96.219L125.512 98.2034C125.993 102.039 123.274 105.539 119.438 106.02L30.1382 117.225C26.3023 117.706 22.8025 114.987 22.3212 111.151L22.0722 109.166Z" fill="#EAEDF6"/>
                    <rect x="15.5836" y="25.3219" width="96" height="84" rx="4" transform="rotate(-7.15156 15.5836 25.3219)" fill="url(#pv_p3)" fillOpacity="0.5"/>
                    <path d="M104.681 57.8361L118.182 71.9115L120.796 92.7481C121.071 94.9401 119.517 96.9399 117.325 97.215L86.0704 101.137L82.9581 76.331L95.4389 58.5433C97.6094 55.45 102.065 55.1091 104.681 57.8361Z" fill="url(#pv_p4)" fillOpacity="0.5"/>
                    <path d="M53.8029 48.687L25.8475 97.4261C25.1994 98.5559 24.9366 99.8659 25.0988 101.158L25.5431 104.7C25.8181 106.892 27.818 108.445 30.01 108.17L105.419 98.7089L63.6435 47.8633C60.9784 44.6196 55.8917 45.0454 53.8029 48.687Z" fill="url(#pv_p5)"/>
                    <circle cx="86.2876" cy="34.5918" r="11" transform="rotate(-7.15156 86.2876 34.5918)" fill="white" filter="url(#pv_f3)"/>
                    <rect x="10" y="20.9833" width="106" height="99" transform="rotate(-7.15156 10 20.9833)" fill="white" fillOpacity="0.3"/>
                  </g>
                </g>
                <g filter="url(#pv_f4)">
                  <rect x="29.7501" y="34" width="106" height="99" rx="9" fill="white" shapeRendering="crispEdges"/>
                  <path d="M37.7501 34.5H127.75C131.892 34.5 135.25 37.8579 135.25 42V125C135.25 129.142 131.892 132.5 127.75 132.5H37.7501C33.608 132.5 30.2501 129.142 30.2501 125V42C30.2501 37.8579 33.608 34.5 37.7501 34.5Z" stroke="#C4C8CF"/>
                  <path d="M30.7501 123C30.7501 125.209 32.541 127 34.7501 127H130.75C132.959 127 134.75 125.209 134.75 123V125C134.75 128.866 131.616 132 127.75 132H37.7501C33.8841 132 30.7501 128.866 30.7501 125V123Z" fill="#EAEDF6"/>
                  <rect x="34.7501" y="39" width="96" height="84" rx="4" fill="url(#pv_p6)" fillOpacity="0.5"/>
                  <path d="M119.106 82.3533L130.75 98V119C130.75 121.209 128.959 123 126.75 123H95.2501V98L109.848 81.9045C112.387 79.1054 116.85 79.3218 119.106 82.3533Z" fill="url(#pv_p7)" fillOpacity="0.5"/>
                  <path d="M69.7633 66.9414L35.9576 111.821C35.174 112.861 34.7501 114.128 34.7501 115.431V119C34.7501 121.209 36.541 123 38.7501 123H114.75L79.6299 67.3492C77.3894 63.7989 72.2892 63.5881 69.7633 66.9414Z" fill="url(#pv_p8)"/>
                  <circle cx="103.75" cy="57" r="11" fill="white" filter="url(#pv_f5)"/>
                </g>
                <g filter="url(#pv_f6)">
                  <rect x="58.7501" y="101" width="47" height="47" rx="23.5" fill="white"/>
                </g>
                <path d="M90.7501 124.5L73.7501 124.5" stroke="#B6B7BF" strokeWidth="3" strokeLinecap="round"/>
                <path d="M82.2501 132.866L82.2501 115.866" stroke="#B6B7BF" strokeWidth="3" strokeLinecap="round"/>
                <defs>
                  <filter id="pv_f0" x="17.7501" y="0" width="148.011" height="143.061" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset dy="5"/><feGaussianBlur stdDeviation="5"/>
                    <feComposite in2="hardAlpha" operator="out"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0.044 0 0 0 0 0.059 0 0 0 0 0.096 0 0 0 0.2 0"/>
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
                  </filter>
                  <filter id="pv_f1" x="107.896" y="31.366" width="23.006" height="26.006" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset dx="1" dy="-4"/><feGaussianBlur stdDeviation="2"/>
                    <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0.685 0 0 0 0 0.717 0 0 0 0 0.921 0 0 0 0.1 0"/>
                    <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
                  </filter>
                  <filter id="pv_f2" x="0" y="2.787" width="137.5" height="131.426" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset dy="5"/><feGaussianBlur stdDeviation="5"/>
                    <feComposite in2="hardAlpha" operator="out"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0.044 0 0 0 0 0.059 0 0 0 0 0.096 0 0 0 0.2 0"/>
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
                  </filter>
                  <filter id="pv_f3" x="75.287" y="19.591" width="23.002" height="26.002" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset dx="1" dy="-4"/><feGaussianBlur stdDeviation="2"/>
                    <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0.685 0 0 0 0 0.717 0 0 0 0 0.921 0 0 0 0.1 0"/>
                    <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
                  </filter>
                  <filter id="pv_f4" x="19.7501" y="29" width="126" height="119" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset dy="5"/><feGaussianBlur stdDeviation="5"/>
                    <feComposite in2="hardAlpha" operator="out"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0.044 0 0 0 0 0.059 0 0 0 0 0.096 0 0 0 0.2 0"/>
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
                  </filter>
                  <filter id="pv_f5" x="92.7501" y="42" width="23" height="26" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset dx="1" dy="-4"/><feGaussianBlur stdDeviation="2"/>
                    <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0.685 0 0 0 0 0.717 0 0 0 0 0.921 0 0 0 0.1 0"/>
                    <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
                  </filter>
                  <filter id="pv_f6" x="44.7501" y="86" width="75" height="75" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset dy="-1"/><feGaussianBlur stdDeviation="7"/>
                    <feComposite in2="hardAlpha" operator="out"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0.064 0 0 0 0 0.085 0 0 0 0 0.219 0 0 0 0.2 0"/>
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
                  </filter>
                  <linearGradient id="pv_p0" x1="104.909" y1="11.1237" x2="104.909" y2="95.1237" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#9EA0AE"/><stop offset="1" stopColor="#646778"/>
                  </linearGradient>
                  <linearGradient id="pv_p1" x1="122.787" y1="67.5985" x2="110.752" y2="112.514" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#E5E8ED"/><stop offset="1" stopColor="#CCD0D6"/>
                  </linearGradient>
                  <linearGradient id="pv_p2" x1="110.869" y1="55.0876" x2="60.3768" y2="100.569" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#E9ECF1"/><stop offset="1" stopColor="#CDD0D6"/>
                  </linearGradient>
                  <linearGradient id="pv_p3" x1="63.5836" y1="25.3219" x2="63.5836" y2="109.322" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#9EA0AE"/><stop offset="1" stopColor="#646778"/>
                  </linearGradient>
                  <linearGradient id="pv_p4" x1="97.8933" y1="52.7885" x2="103.682" y2="98.9268" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#E5E8ED"/><stop offset="1" stopColor="#CCD0D6"/>
                  </linearGradient>
                  <linearGradient id="pv_p5" x1="82.1376" y1="45.6948" x2="52.5217" y2="106.858" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#E9ECF1"/><stop offset="1" stopColor="#CDD0D6"/>
                  </linearGradient>
                  <linearGradient id="pv_p6" x1="82.7501" y1="39" x2="82.7501" y2="123" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#9EA0AE"/><stop offset="1" stopColor="#646778"/>
                  </linearGradient>
                  <linearGradient id="pv_p7" x1="113" y1="76.5" x2="113" y2="123" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#E5E8ED"/><stop offset="1" stopColor="#CCD0D6"/>
                  </linearGradient>
                  <linearGradient id="pv_p8" x1="98.2501" y1="67.5" x2="61.2501" y2="124.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#E9ECF1"/><stop offset="1" stopColor="#CDD0D6"/>
                  </linearGradient>
                  <clipPath id="pv_c0">
                    <rect x="53.3732" y="5" width="106" height="99" rx="9" transform="rotate(15 53.3732 5)" fill="white"/>
                  </clipPath>
                  <clipPath id="pv_c1">
                    <rect x="10" y="20.9833" width="106" height="99" rx="9" transform="rotate(-7.15156 10 20.9833)" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
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
          <ImagePlus className="h-8 w-8 text-muted-foreground/40 mb-1" />
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
