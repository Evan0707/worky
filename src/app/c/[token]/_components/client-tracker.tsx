"use client";

import { useEffect } from "react";
import { api } from "@/trpc/react";

export function ClientTracker({ token }: { token: string }) {
  const markViewed = api.project.markClientViewed.useMutation();

  useEffect(() => {
    markViewed.mutate({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
