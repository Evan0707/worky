import { createTRPCRouter } from "@/server/api/trpc";
import { projectRouter } from "@/server/api/routers/project";
import { photoRouter } from "@/server/api/routers/photo";
import { timeEntryRouter } from "@/server/api/routers/time-entry";
import { materialRouter } from "@/server/api/routers/material";
import { userRouter } from "@/server/api/routers/user";
import { invoiceRouter } from "@/server/api/routers/invoice";
import { stripeRouter } from "@/server/api/routers/stripe";
import { teamRouter } from "@/server/api/routers/team";
import { projectNoteRouter } from "@/server/api/routers/project-note";
import { tagRouter } from "@/server/api/routers/tag";
import { taskRouter } from "@/server/api/routers/task";
import { notificationRouter } from "@/server/api/routers/notification";
import { messageRouter } from "@/server/api/routers/message";
import { planningRouter } from "@/server/api/routers/planning";
import { reportRouter } from "@/server/api/routers/report";
import { projectTemplateRouter } from "@/server/api/routers/project-template";
import { safetyChecklistRouter } from "@/server/api/routers/safety-checklist";

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
  invoice: invoiceRouter,
  stripe: stripeRouter,
  team: teamRouter,
  projectNote: projectNoteRouter,
  tag: tagRouter,
  task: taskRouter,
  notification: notificationRouter,
  message: messageRouter,
  planning: planningRouter,
  report: reportRouter,
  projectTemplate: projectTemplateRouter,
  safetyChecklist: safetyChecklistRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
