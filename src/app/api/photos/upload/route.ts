import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@/server/auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const results = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new Promise<{ url: string; key: string; name: string }>(
          (resolve, reject) => {
            cloudinary.uploader
              .upload_stream(
                {
                  folder: `OpenChantierkr/${session.user.id}`,
                  resource_type: "image",
                  transformation: [
                    { quality: "auto:good" },
                    { fetch_format: "auto" },
                  ],
                },
                (error, result) => {
                  if (error || !result) {
                    reject(error ?? new Error("Upload failed"));
                    return;
                  }
                  resolve({
                    url: result.secure_url,
                    key: result.public_id,
                    name: file.name,
                  });
                }
              )
              .end(buffer);
          }
        );
      })
    );

    return NextResponse.json({ files: results });
  } catch (err) {
    console.error("[Cloudinary Upload Error]", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

