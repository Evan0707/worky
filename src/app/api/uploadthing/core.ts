import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import { auth } from "@/server/auth";
import { db } from "@/server/db";

const f = createUploadthing();

export const ourFileRouter = {
  /**
   * Image uploader for chantier photos
   * Max 8MB, up to 10 files at once
   * Authenticated users only
   * Accepted MIME types: image/jpeg, image/png, image/webp
   */
  imageUploader: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 10,
    },
  })
    .middleware(async ({ req: _req }) => {
      const session = await auth();

      if (!session?.user) throw new UploadThingError("Unauthorized");

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      // Return file info to client — actual DB insert is done via tRPC photo.save
      return {
        uploadedBy: metadata.userId,
        url: file.ufsUrl,
        key: file.key,
        name: file.name,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
