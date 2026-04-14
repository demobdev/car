import { InfoIcon } from "@/shared/ui/Icons";

interface GeneralHeaderProps {
  onSaveDraft?: () => void;
  onOrderPrint?: () => void;
}

export default function GeneralHeader({
  onSaveDraft,
  onOrderPrint,
}: GeneralHeaderProps) {
  return (
    <header className="general-header">
      <div className="desktop-brand">
        <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="desktop-brand-copy brand-copy">
            <h1 className="desktop-brand-title">Cartographica</h1>
            <p className="desktop-brand-kicker app-kicker">
              Custom Map Print Studio
            </p>
          </div>
        </a>
      </div>

      <div className="general-header-actions">
        <nav className="general-header-nav" aria-label="Site navigation">
          {onSaveDraft && (
            <button
              type="button"
              className="general-header-text-btn"
              onClick={onSaveDraft}
              aria-label="Save Draft"
              style={{ fontWeight: 600, color: 'var(--brand-color, #a8d5b4)', border: 'none', background: 'transparent' }}
            >
              <span className="general-header-btn-label">Save Draft</span>
            </button>
          )}
          
          {onOrderPrint && (
            <button
              type="button"
              className="general-header-text-btn CheckoutCTA-placeholder"
              onClick={onOrderPrint}
              aria-label="Order Print"
              style={{ 
                backgroundColor: 'var(--brand-color, #a8d5b4)', 
                color: '#000', 
                padding: '0.25rem 0.75rem', 
                borderRadius: '4px',
                marginLeft: '0.5rem',
                fontWeight: 'bold'
              }}
            >
              <span className="general-header-btn-label">Order Print</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
