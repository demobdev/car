/**
 * Pre-instantiated infrastructure services.
 *
 * This module creates singleton instances of the hexagonal adapters,
 * wiring them to the concrete cache and HTTP implementations.
 * Application hooks import from here instead of calling factories directly.
 */

import { localStorageCache } from "@/core/cache/localStorageCache";
import { fetchAdapter } from "@/core/http/fetchAdapter";
import { googleFontsAdapter } from "@/core/fonts/googleFontsAdapter";
import { createNominatimAdapter } from "@/features/location/infrastructure/nominatimAdapter";
import { PrintfulProvider } from "@/features/checkout/infrastructure/PrintfulProvider";

/* ── Location / Geocoding ── */

const nominatim = createNominatimAdapter(fetchAdapter, localStorageCache);

export const searchLocations = nominatim.searchLocations;
export const geocodeLocation = nominatim.geocodeLocation;
export const reverseGeocodeCoordinates = nominatim.reverseGeocode;

/* ── Fonts ── */

export const ensureGoogleFont =
  googleFontsAdapter.ensureFont.bind(googleFontsAdapter);

/* ── Poster compositing ── */

export { compositeExport } from "@/features/poster/infrastructure/renderer";

/* ── Export helpers ── */

export { captureMapAsCanvas } from "@/features/export/infrastructure/mapExporter";

export { createPngBlob } from "@/features/export/infrastructure/pngExporter";
export { createLayeredSvgBlobFromMap } from "@/features/export/infrastructure/layeredSvgExporter";

export { createPdfBlobFromCanvas } from "@/features/export/infrastructure/pdfExporter";

export { createPosterFilename } from "@/features/export/infrastructure/filenameGenerator";

export { triggerDownloadBlob } from "@/features/export/infrastructure/fileDownloader";

/* ── Poster draft persistence ── */

import { SupabaseDraftRepository } from "@/features/poster/infrastructure/SupabaseDraftRepository";

export const posterDraftRepository = new SupabaseDraftRepository();

/* ── Print Provider ── */

export const printProvider = new PrintfulProvider(fetchAdapter);

