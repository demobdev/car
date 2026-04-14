import type { IPosterDraftRepository, PosterDraft } from "@/features/poster/domain/ports";

export class SupabaseDraftRepository implements IPosterDraftRepository {
  private readonly baseUrl: string;
  private readonly anonKey: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_SUPABASE_URL || "";
    this.anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
  }

  private get headers() {
    return {
      "apikey": this.anonKey,
      "Authorization": `Bearer ${this.anonKey}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    };
  }

  async save(draft: PosterDraft): Promise<void> {
    const payload = {
      id: draft.id,
      title: draft.form.displayCity || "Untitled Map",
      form_data: draft,
      image_url: draft.imageUrl,
      updated_at: new Date().toISOString()
    };

    try {
      // Use On-Conflict to Upsert in a single request
      const res = await fetch(`${this.baseUrl}/rest/v1/poster_drafts`, {
        method: "POST",
        headers: {
          ...this.headers,
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Connection failed");
      }
    } catch (err) {
      console.error("[Supabase Repository] Save failed:", err);
      throw err;
    }
  }

  async load(id: string): Promise<PosterDraft | null> {
    try {
      const res = await fetch(`${this.baseUrl}/rest/v1/poster_drafts?id=eq.${id}&select=*`, {
        headers: this.headers
      });
      const data = await res.json();
      if (res.ok && data.length > 0) {
        return data[0].form_data as PosterDraft;
      }
      return null;
    } catch (err) {
      console.error("[Supabase Repository] Load failed:", err);
      return null;
    }
  }

  async list(): Promise<PosterDraft[]> {
    try {
      // Sort by stars first, then by date (Trending)
      const res = await fetch(`${this.baseUrl}/rest/v1/poster_drafts?select=*&order=stars.desc,updated_at.desc&limit=20`, {
        headers: this.headers
      });
      const data = await res.json();
      if (res.ok) {
        return data.map((d: any) => ({
          ...d.form_data,
          stars: d.stars,
          id: d.id
        }));
      }
      return [];
    } catch (err) {
      console.error("[Supabase Repository] List failed:", err);
      return [];
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/rest/v1/poster_drafts?id=eq.${id}`, {
        method: "DELETE",
        headers: this.headers
      });
    } catch (err) {
      console.error("[Supabase Repository] Delete failed:", err);
    }
  }

  async star(id: string): Promise<number> {
    try {
      // We use the RPC function we defined in the plan to prevent race conditions
      const res = await fetch(`${this.baseUrl}/rest/v1/rpc/star_design`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ design_id: id })
      });
      
      // Fetch new count to return
      const loadRes = await fetch(`${this.baseUrl}/rest/v1/poster_drafts?id=eq.${id}&select=stars`, {
        headers: this.headers
      });
      const data = await loadRes.json();
      return data[0]?.stars || 0;
    } catch (err) {
      console.error("[Supabase Repository] Star failed:", err);
      return 0;
    }
  }
}
