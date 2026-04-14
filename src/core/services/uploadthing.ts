import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react";
import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "../../server/uploadthing";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

// Programmatic upload helper — used to send blob snapshots to UploadThing
export const { uploadFiles } = genUploader<OurFileRouter>({
  url: "/api/uploadthing",
});
