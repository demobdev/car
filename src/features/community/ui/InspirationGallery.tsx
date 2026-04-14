import { useEffect, useState } from "react";

interface CommunityDesign {
  id: string;
  location: string;
  image_url: string;
  theme: string;
  created_at: string;
}

export default function InspirationGallery() {
  const [designs, setDesigns] = useState<CommunityDesign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!url || !key) return;

        const res = await fetch(`${url}/rest/v1/community_designs?select=*&order=created_at.desc&limit=8`, {
          headers: {
            "apikey": key,
            "Authorization": `Bearer ${key}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setDesigns(data);
        }
      } catch (err) {
        console.error("Failed to fetch community designs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDesigns();
  }, []);

  return (
    <section className="inspiration-gallery">
      <div className="section-header">
        <h3 className="section-title">Inspired by our Community</h3>
        <p className="section-subtitle">Real maps designed by people like you.</p>
      </div>

      <div className="gallery-scroll">
        <div className="gallery-track">
          {designs.length > 0 ? (
            designs.map((design) => (
              <div key={design.id} className="gallery-item">
                <div className="gallery-image-container">
                  <img src={design.image_url} alt={design.location} loading="lazy" />
                  <div className="gallery-overlay">
                    <span className="gallery-location">{design.location}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              {[1, 2, 3].map(i => (
                <div key={i} className="gallery-item placeholder">
                  <div className="gallery-image-container">
                    <div className="placeholder-content">
                      <span className="placeholder-title">Premium Curation</span>
                      <span className="placeholder-text">Awaiting the first masterpiece</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <style>{`
        .inspiration-gallery {
          padding: 80px 0;
          background: #000;
          overflow: hidden;
        }
        .section-header {
          text-align: center;
          margin-bottom: 48px;
          padding: 0 20px;
        }
        .section-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 8px;
          color: #fff;
        }
        .section-subtitle {
          color: rgba(255,255,255,0.5);
          font-size: 1rem;
        }
        .gallery-scroll {
          width: 100%;
          overflow-x: auto;
          padding: 0 40px 20px;
          scrollbar-width: none;
        }
        .gallery-scroll::-webkit-scrollbar {
          display: none;
        }
        .gallery-track {
          display: flex;
          gap: 24px;
          width: max-content;
        }
        .gallery-item {
          width: 280px;
          flex-shrink: 0;
          border-radius: 12px;
          overflow: hidden;
          background: #111;
          border: 1px solid rgba(255,255,255,0.05);
          transition: transform 0.3s ease;
        }
        .gallery-item:hover {
          transform: translateY(-8px);
          border-color: var(--brand-color);
        }
        .gallery-image-container {
          position: relative;
          aspect-ratio: 3/4;
        }
        .gallery-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .gallery-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 20px;
          background: linear-gradient(transparent, rgba(0,0,0,0.8));
          color: #fff;
        }
        .gallery-location {
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* PLACEHOLDER STYLES */
        .gallery-item.placeholder {
          background: linear-gradient(135deg, #0a0c0a 0%, #1a1c1a 100%);
          border: 1px dashed rgba(255,255,255,0.05);
        }
        .placeholder-content {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          text-align: center;
          gap: 8px;
        }
        .placeholder-title {
          font-weight: 700;
          font-size: 0.9rem;
          color: #34d399;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          opacity: 0.6;
        }
        .placeholder-text {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.3);
        }
      `}</style>
    </section>
  );
}
