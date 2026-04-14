import { CheckIcon } from "@/shared/ui/Icons";
import { useMemo } from "react";

export default function CheckoutSuccess() {
  const orderId = useMemo(() => `CART-${Math.floor(Math.random() * 90000) + 10000}`, []);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      background: '#0a0c0a', // Deep forest dark
      color: '#fff',
      padding: '40px 20px',
      fontFamily: '"Montserrat", sans-serif'
    }}>
      <div style={{ maxWidth: '600px', width: '100%', textAlign: 'center', animation: 'fadeInUp 0.8s ease-out' }}>
        
        {/* Success Header */}
        <div style={{ 
          background: 'rgba(52, 211, 153, 0.1)', 
          color: '#34d399', 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 32px', 
          fontSize: '40px',
          border: '1px solid rgba(52, 211, 153, 0.2)'
        }}>
          <CheckIcon />
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Thank you for your order.</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', margin: '0 0 40px' }}>
          Order <span style={{ color: '#34d399', fontWeight: 600 }}>{orderId}</span> is now in production.
        </p>

        {/* Production Timeline */}
        <div style={{ 
          background: 'rgba(255,255,255,0.03)', 
          border: '1px solid rgba(255,255,255,0.1)', 
          borderRadius: '20px', 
          padding: '40px',
          marginBottom: '40px'
        }}>
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, margin: '0 0 32px' }}>
            Production Timeline
          </h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            {/* Connector Line */}
            <div style={{ position: 'absolute', top: '15px', left: '10%', right: '10%', height: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 0 }} />
            
            <TimelineStep label="Preparing" status="completed" />
            <TimelineStep label="Production" status="active" />
            <TimelineStep label="Shipping" status="pending" />
          </div>

          <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '1rem' }}>Shipping Expectations</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' }}>
              Your custom map is being meticulously printed and framed. Please allow **5-7 business days** for high-fidelity production and secure delivery to your doorstep.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button 
            type="button" 
            style={{ 
              width: '100%', 
              padding: '18px', 
              background: '#34d399', 
              color: '#000', 
              border: 'none', 
              borderRadius: '12px', 
              fontSize: '1rem', 
              fontWeight: 700, 
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onClick={() => window.location.href = '/'}
          >
            Create Another Map
          </button>
          
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: '16px' }}>
            A detailed receipt has been sent to your email. <br/>
            Need help? Contact us at <a href="mailto:studio@cartographica.app" style={{ color: '#34d399', textDecoration: 'none' }}>studio@cartographica.app</a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function TimelineStep({ label, status }: { label: string; status: 'completed' | 'active' | 'pending' }) {
  const color = status === 'completed' || status === 'active' ? '#34d399' : 'rgba(255,255,255,0.2)';
  const dotScale = status === 'active' ? '1.5' : '1';
  const opacity = status === 'pending' ? 0.3 : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 1, opacity }}>
      <div style={{ 
        width: '32px', 
        height: '32px', 
        borderRadius: '50%', 
        background: status === 'completed' ? '#34d399' : '#0a0c0a',
        border: `2px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${dotScale})`,
        boxShadow: status === 'active' ? '0 0 20px rgba(52, 211, 153, 0.4)' : 'none'
      }}>
        {status === 'completed' && <CheckIcon style={{ fontSize: '16px', color: '#000' } as any} />}
        {status === 'active' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }} />}
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color }}>{label}</span>
    </div>
  );
}

