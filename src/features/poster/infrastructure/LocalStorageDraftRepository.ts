import type { IPosterDraftRepository, PosterDraft } from "@/features/poster/domain/ports";

const DRAFT_STORAGE_KEY = "cartographica:drafts";

export class LocalStorageDraftRepository implements IPosterDraftRepository {
  async save(draft: PosterDraft): Promise<void> {
    const drafts = await this.list();
    const existingIndex = drafts.findIndex((d) => d.id === draft.id);
    
    if (existingIndex >= 0) {
      drafts[existingIndex] = draft;
    } else {
      drafts.push(draft);
    }

    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
  }

  async load(id: string): Promise<PosterDraft | null> {
    const drafts = await this.list();
    return drafts.find((d) => d.id === id) || null;
  }

  async list(): Promise<PosterDraft[]> {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Sort by newest first
        return parsed.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      }
      return [];
    } catch {
      return [];
    }
  }

  async remove(id: string): Promise<void> {
    const drafts = await this.list();
    const nextDrafts = drafts.filter((d) => d.id !== id);
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(nextDrafts));
  }
}
