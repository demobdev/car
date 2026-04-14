import { Suspense, lazy, useEffect, useState } from "react";
import FooterNote from "./FooterNote";
import GeneralHeader from "./GeneralHeader";
import { posterDraftRepository } from "@/core/services";
import type { PosterDraft } from "@/features/poster/domain/ports";
import InspirationGallery from "@/features/community/ui/InspirationGallery";
import { StarIcon, PlusIcon } from "@/shared/ui/Icons";
import type { SupabaseDraftRepository } from "@/features/poster/infrastructure/SupabaseDraftRepository";

const LicensesModal = lazy(() => import("@/shared/ui/LicensesModal"));
const AttributionModal = lazy(() => import("@/shared/ui/AttributionModal"));

interface HomepageProps {
  onStart: (preset?: { title: string; subtitle: string }) => void;
  onResume: (draft: PosterDraft) => void;
}

export default function Homepage({ onStart, onResume }: HomepageProps) {
  const [licensesOpen, setLicensesOpen] = useState(false);
  const [attributionOpen, setAttributionOpen] = useState(false);
  const [drafts, setDrafts] = useState<PosterDraft[]>([]);
  const [hasVoted, setHasVoted] = useState<Record<string, boolean>>({});

  const fetchDrafts = () => {
    posterDraftRepository.list().then(setDrafts).catch(console.error);
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handleStar = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (hasVoted[id]) return;

    try {
      // Cast to SupabaseDraftRepository to access .star()
      const repo = posterDraftRepository as SupabaseDraftRepository;
      const newCount = await repo.star(id);
      
      setDrafts(prev => prev.map(d => d.id === id ? { ...d, stars: newCount } : d));
      setHasVoted(prev => ({ ...prev, [id]: true }));
    } catch (err) {
      console.error("Star failed:", err);
    }
  };

  return (
    <div className="homepage">
      <GeneralHeader />

      <main className="homepage-hero">
        <h2 className="hero-title">Beautiful Custom Map Posters, Instantly.</h2>
        <p className="hero-subtitle">
          Design premium, print-ready maps of your favorite places in the world.
          Whether it's your hometown, where you met, or your next adventure.
        </p>
        
        <div className="hero-actions">
          <button className="hero-cta-button" onClick={() => onStart()}>
            Create Your Map
          </button>
        </div>

        <section className="recent-drafts">
          <div className="section-header-flex">
            <h3 className="section-title">Studio Activity</h3>
            <span className="live-indicator">LIVE FEED</span>
          </div>
          
          {drafts.length > 0 ? (
            <div className="drafts-grid">
              {drafts.slice(0, 8).map((draft) => (
                <div key={draft.id} className="community-card-container">
                  <div className="draft-card community-style">
                    {/* Visual Preview */}
                    <div className="card-preview" onClick={() => onResume(draft)}>
                      {draft.imageUrl ? (
                        <img src={draft.imageUrl} alt={draft.form.displayCity} className="card-thumb" />
                      ) : (
                        <div className="thumb-placeholder">
                          <PlusIcon />
                        </div>
                      )}
                      
                      {/* Glassmorphism Title Overlay */}
                      <div className="card-overlay">
                        <span className="draft-title">
                          {draft.form.displayCity || "Untitled Map"}
                        </span>
                        <span className="draft-date">
                          {draft.form.displayCountry || "World"}
                        </span>
                      </div>
                    </div>

                    {/* Social Logic */}
                    <div className="card-social">
                      <div 
                        className={`star-count-badge ${hasVoted[draft.id] ? 'is-active' : ''}`}
                        onClick={(e) => handleStar(e, draft.id)}
                      >
                        <StarIcon />
                        <span>{draft.stars || 0}</span>
                      </div>
                      <button className="remix-action" onClick={() => onResume(draft)}>
                        <PlusIcon /> <span>Remix</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-studio-state">
              <div className="empty-icon"><PlusIcon /></div>
              <p>The global studio is waiting for its next masterpiece.</p>
              <button className="empty-state-cta" onClick={() => onStart()}>
                Start a New Design
              </button>
            </div>
          )}
        </section>
      </main>

      <InspirationGallery />

      <FooterNote 
        onLicensesOpen={() => setLicensesOpen(true)}
        onAttributionOpen={() => setAttributionOpen(true)}
      />

      <style>{`
        .section-header-flex {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
          justify-content: center;
        }
        .live-indicator {
          font-size: 0.65rem;
          font-weight: 800;
          color: #34d399;
          background: rgba(52, 211, 153, 0.1);
          padding: 4px 8px;
          border-radius: 4px;
          letter-spacing: 0.1em;
          border: 1px solid rgba(52, 211, 153, 0.2);
        }
        .community-card-container {
         /* DRAFT CARDS (PREMIUM GALLERY STYLE) */
        .draft-card {
          width: 100%;
          background: #111;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.05);
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
        }
        .draft-card:hover {
          transform: translateY(-8px);
          border-color: rgba(52, 211, 153, 0.3);
          box-shadow: 0 12px 32px rgba(0,0,0,0.4);
        }

        .card-preview {
          position: relative;
          width: 100%;
          aspect-ratio: 3/4;
          background: #000;
          cursor: pointer;
          overflow: hidden;
        }
        .card-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .draft-card:hover .card-thumb {
          transform: scale(1.05);
        }
        .thumb-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.1);
          font-size: 2rem;
        }

        .card-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px;
          background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
          backdrop-filter: blur(4px);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .draft-title {
          font-weight: 700;
          font-size: 1rem;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .draft-date {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.6);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-social {
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #111;
          border-top: 1px solid rgba(255,255,255,0.03);
        }
        .star-count-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          color: rgba(255,255,255,0.4);
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .star-count-badge:hover {
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
        }
        .star-count-badge.is-active {
          color: #f59e0b;
        }

        .remix-action {
          background: transparent;
          border: 1px solid rgba(52, 211, 153, 0.2);
          color: #34d399;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 6px 12px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .remix-action:hover {
          background: #34d399;
          color: #000;
        }

        /* EMPTY STATES */
        .empty-studio-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 60px 20px;
          background: rgba(255,255,255,0.02);
          border: 1px dashed rgba(255,255,255,0.1);
          border-radius: 20px;
          color: rgba(255,255,255,0.5);
          text-align: center;
        }
        .empty-icon {
          font-size: 2rem;
          color: #34d399;
          opacity: 0.5;
        }
        .empty-state-cta {
          padding: 12px 24px;
          background: #34d399;
          color: #000;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .empty-state-cta:hover {
          transform: scale(1.05);
        }
      `}</style>

      {/* MODALS */}
      {licensesOpen ? (
        <Suspense fallback={null}>
          <LicensesModal onClose={() => setLicensesOpen(false)} />
        </Suspense>
      ) : null}
      {attributionOpen ? (
        <Suspense fallback={null}>
          <AttributionModal onClose={() => setAttributionOpen(false)} />
        </Suspense>
      ) : null}
    </div>
  );
}
