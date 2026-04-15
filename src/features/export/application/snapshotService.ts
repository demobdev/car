import type { Map } from "maplibre-gl";
import { captureMapAsCanvas } from "@/features/export/infrastructure/mapExporter";
import { compositeExport } from "@/features/poster/infrastructure/renderer";
import { resolveCanvasSize } from "@/features/poster/infrastructure/renderer/canvas";
import { supabase } from "@/core/services/supabase";
import type { ResolvedTheme } from "@/features/theme/domain/types";
import type { MarkerItem, MarkerIconDefinition } from "@/features/markers/domain/types";
import { CM_PER_INCH } from "@/core/config";

interface SnapshotOptions {
  map: Map;
  theme: ResolvedTheme;
  form: {
    latitude: string;
    longitude: string;
    width: string;
    height: string;
    fontFamily: string;
    showPosterText: boolean;
    showMarkers: boolean;
    includeCredits: boolean;
    displayCity?: string;
    displayCountry?: string;
    location?: string;
    occasion?: string;
  };
  markers?: MarkerItem[];
  markerIcons?: MarkerIconDefinition[];
}

/** 
 * Captures the current map poster as a JPEG blob 
 * and uploads it to Supabase Storage. Returns the public URL.
 */
export async function captureAndUploadSnapshot(opts: SnapshotOptions): Promise<string> {
  const { map, theme, form, markers = [], markerIcons = [] } = opts;

  const widthCm = Number(form.width) || 45.72; // 18" default
  const heightCm = Number(form.height) || 60.96; // 24" default
  const widthInches = widthCm / CM_PER_INCH;
  const heightInches = heightCm / CM_PER_INCH;
  const lat = Number(form.latitude) || 0;
  const lon = Number(form.longitude) || 0;

  // Use a lower DPI for the preview snapshot to keep it fast (150dpi is plenty for Printful mockups)
  const PREVIEW_DPI = 150;
  const INCHES_TO_PX = PREVIEW_DPI;
  const targetWidth = Math.round(widthInches * INCHES_TO_PX);
  const targetHeight = Math.round(heightInches * INCHES_TO_PX);

  const size = resolveCanvasSize(widthInches, heightInches);
  const snapshotWidth = Math.min(targetWidth, size.width);
  const snapshotHeight = Math.min(targetHeight, size.height);

  // 1. Capture the live MapLibre canvas
  const { canvas: mapCanvas } = await captureMapAsCanvas(map, snapshotWidth, snapshotHeight);

  // 2. Composite text overlay and gradient fades
  const { canvas } = await compositeExport(mapCanvas, {
    theme,
    center: { lat, lon },
    widthInches,
    heightInches,
    displayCity: form.displayCity || form.location || "",
    displayCountry: form.displayCountry || "",
    locationText: form.location,
    fontFamily: form.fontFamily?.trim() || "",
    showPosterText: form.showPosterText,
    showOverlay: form.showMarkers,
    includeCredits: form.includeCredits,
    occasion: form.occasion,
    markers,
    markerIcons,
  });

  // 3. Convert canvas -> JPEG Blob (~70% quality to keep file small for upload speed)
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => b ? resolve(b) : reject(new Error("Failed to create blob")),
      "image/jpeg",
      0.7,
    );
  });

  // 4. Upload raw blob to Supabase Storage
  const fileName = `map-snapshot-${Date.now()}.jpg`;

  const { data, error } = await supabase.storage
    .from("snapshots")
    .upload(fileName, blob, {
      contentType: "image/jpeg",
      cacheControl: "3600",
      upsert: false
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}. Please ensure a public bucket named 'snapshots' exists.`);
  }

  // Retrieve the public URL for Printful
  const { data: urlData } = supabase.storage
    .from("snapshots")
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

/**
 * LIGHTWEIGHT THUMBNAIL ENGINE
 * Captures a small (400px) preview specifically for the community studio feed.
 * Optimized for speed and low bandwidth.
 */
export async function captureThumbnail(opts: SnapshotOptions): Promise<string> {
  const { map, theme, form, markers = [], markerIcons = [] } = opts;

  // 1. FAST VIEWPORT CAPTURE
  // We use a fixed 400px width for thumbnails. 3:4 aspect ratio (400x533).
  const targetWidth = 400;
  const targetHeight = 533;
  const widthInches = 18; // Default normalization for text scaling
  const heightInches = 24;

  const { canvas: mapCanvas } = await captureMapAsCanvas(map, targetWidth, targetHeight);

  // 2. LIGHT COMPOSITING
  const { canvas } = await compositeExport(mapCanvas, {
    theme,
    center: { lat: map.getCenter().lat, lon: map.getCenter().lng },
    widthInches,
    heightInches,
    displayCity: form.displayCity || form.location || "",
    displayCountry: form.displayCountry || "",
    locationText: form.location,
    fontFamily: form.fontFamily?.trim() || "",
    showPosterText: form.showPosterText,
    showOverlay: form.showMarkers,
    includeCredits: false, // Hide credits on thumbnails for cleaner look
    occasion: form.occasion,
    markers,
    markerIcons,
  });

  // 3. HIGH COMPRESSION (Fast Upload)
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => b ? resolve(b) : reject(new Error("Thumbnail failure")),
      "image/jpeg",
      0.5, // High compression is fine for thumbnails
    );
  });

  // 4. STORAGE SYNC
  const fileName = `thumb-${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;
  const { error } = await supabase.storage.from("snapshots").upload(fileName, blob);
  if (error) throw error;

  const { data: urlData } = supabase.storage.from("snapshots").getPublicUrl(fileName);
  return urlData.publicUrl;
}
