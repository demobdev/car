/**
 * Poster draft persistence port.
 *
 * V1 stub — provides the interface for save-draft functionality.
 * Swap the NoopDraftRepository for a real adapter (localStorage, API)
 * when persistence is implemented.
 */

import type { PosterForm } from "../application/posterReducer";
import type { MarkerItem } from "@/features/markers/domain/types";

export interface PosterDraft {
  id: string;
  form: PosterForm;
  customColors: Record<string, string>;
  markers: MarkerItem[];
  imageUrl?: string;
  stars?: number;
  updatedAt: string;
}

export interface IPosterDraftRepository {
  save(draft: PosterDraft): Promise<void>;
  load(id: string): Promise<PosterDraft | null>;
  list(): Promise<PosterDraft[]>;
  remove(id: string): Promise<void>;
}
