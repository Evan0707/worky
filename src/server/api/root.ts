import { createTRPCRouter } from "@/server/api/trpc";
import { projectRouter } from "@/server/api/routers/project";
import { photoRouter } from "@/server/api/routers/photo";
import { timeEntryRouter } from "@/server/api/routers/time-entry";
import { materialRouter } from "@/server/api/routers/material";
import { userRouter } from "@/server/api/routers/user";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  project: projectRouter,
  photo: photoRouter,
  timeEntry: timeEntryRouter,
  material: materialRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
