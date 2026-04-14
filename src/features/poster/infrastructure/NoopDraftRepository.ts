/**
 * No-op draft repository.
 *
 * Satisfies the IPosterDraftRepository interface without performing any I/O.
 * Used as the default adapter in V1 until real persistence is implemented.
 *
 * TODO: Replace with LocalStorageDraftRepository or an API-backed adapter.
 */

import type { IPosterDraftRepository, PosterDraft } from "@/features/poster/domain/ports";

export class NoopDraftRepository implements IPosterDraftRepository {
  async save(_draft: PosterDraft): Promise<void> {
    // no-op
  }

  async load(_id: string): Promise<PosterDraft | null> {
    return null;
  }

  async list(): Promise<PosterDraft[]> {
    return [];
  }

  async remove(_id: string): Promise<void> {
    // no-op
  }
}
