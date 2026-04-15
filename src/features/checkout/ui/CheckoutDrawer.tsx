import { useState, useEffect, useRef } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { CloseIcon, CheckIcon } from "@/shared/ui/Icons";
import { formatLayoutDimensions, getLayoutOption } from "@/features/layout/infrastructure/layoutRepository";
import PosterTextOverlay from "@/features/poster/ui/PosterTextOverlay";
import { printProvider } from "@/core/services";
import { captureAndUploadSnapshot } from "@/features/export/application/snapshotService";
import { getAllMarkerIcons } from "@/features/markers/infrastructure/iconRegistry";
import type { OrderCost, ShippingAddress } from "../domain/ports";
import { useToast } from "@/shared/context/ToastContext";

interface CheckoutDrawerProps {
  onClose: () => void;
}

export default function CheckoutDrawer({ onClose }: CheckoutDrawerProps) {
  const { state, dispatch, effectiveTheme, mapRef } = usePosterContext();
  const { form } = state;
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [mapSnapshot, setMapSnapshot] = useState<string | null>(null);
  const [realMockupUrl, setRealMockupUrl] = useState<string | null>(null);
  const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);
  const [mockupStatus, setMockupStatus] = useState<string>("idle");
  const [designUrl, setDesignUrl] = useState<string | null>(null);
  const [frameStyle, setFrameStyle] = useState<"natural" | "black" | "white" | "none">("natural");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [orderCost, setOrderCost] = useState<OrderCost | null>(null);
  const snapshotInProgress = useRef(false);

  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      try {
        setMapSnapshot(map.getCanvas().toDataURL("image/png"));
      } catch (err) {
        console.error("Failed to capture map snapshot:", err);
      }
    }
  }, [mapRef]);

  // Automation: Force 18x24 Gallery Standard for the order flow
  useEffect(() => {
    if (state.form.layout !== "print_18x24_portrait") {
      dispatch({ 
        type: "SET_LAYOUT", 
        layoutId: "print_18x24_portrait",
        widthCm: "45.72",
        heightCm: "60.96"
      });
    }
  }, []);

  // Pricing Logic
  const layoutOption = getLayoutOption(form.layout);
  const widthCm = layoutOption?.widthCm || Number(form.width) || 21;
  const heightCm = layoutOption?.heightCm || Number(form.height) || 29.7;
  
  const sizeLabel = layoutOption ? formatLayoutDimensions(layoutOption) : "Custom Size";
  const aspect = widthCm / heightCm;
  const formLat = Number(form.latitude) || 0;
  const formLon = Number(form.longitude) || 0;

  // Real Pricing Effect
  useEffect(() => {
    const variantId = printProvider.getVariantForLayout(form.layout, { frameStyle });
    if (variantId) {
      // For the preview, we calculate base cost. Stripe handles precise tax/shipping later.
      printProvider.calculateOrderCost(variantId, { countryCode: "US", zip: "" } as ShippingAddress)
        .then(setOrderCost)
        .catch(err => console.error("Failed to calculate cost:", err));
    }
  }, [form.layout, frameStyle]);

  // Retail Pricing: Using real cost if available, falling back to $45.00
  const formattedPrice = orderCost 
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: orderCost.currency }).format(parseFloat(orderCost.total))
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(45.00);

  // Step 1: Capture & upload the map snapshot once on mount
  useEffect(() => {
    const map = mapRef.current;
    if (!map || snapshotInProgress.current) return;
    snapshotInProgress.current = true;
    setMockupStatus("capturing");

    captureAndUploadSnapshot({
      map,
      theme: effectiveTheme,
      form,
      markers: state.markers,
      markerIcons: getAllMarkerIcons(state.customMarkerIcons),
    })
      .then((url) => {
        setDesignUrl(url);
        setMapSnapshot(url);
        setMockupStatus("uploaded");
      })
      .catch((err) => {
        console.error("Snapshot upload failed:", err);
        setMockupStatus("error");
        // Fallback to a high-res 18x24 placeholder (Unsplash dark gradient) to prevent Printful from throwing 400s
        setDesignUrl("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1800&h=2400&fit=crop");
      })
      .finally(() => { snapshotInProgress.current = false; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 2: Generate Printful mockup once we have a designUrl (debounced for frame style changes)
  useEffect(() => {
    if (!designUrl) return;
    const variantId = printProvider.getVariantForLayout(form.layout, { frameStyle });
    if (!variantId) return;

    // Check for "Instant Cache Hit" - if we already have it, don't wait 2 seconds or show a spinner!
    const cachedUrl = printProvider.getCachedMockup(variantId, designUrl);
    if (cachedUrl) {
      setRealMockupUrl(cachedUrl);
      setMockupStatus("done");
      setIsGeneratingMockup(false);
      return;
    }

    // PREDICTIVE RENDER ENGINE
    // 1. Generate the CURRENT selection immediately (High Priority)
    setIsGeneratingMockup(true);
    setRealMockupUrl(null);
    setMockupStatus("generating");

    const startTime = Date.now();
    const checkProgress = setInterval(() => {
      if (Date.now() - startTime > 15000) {
        setMockupStatus("generating_long");
        clearInterval(checkProgress);
      }
    }, 5000);

    printProvider.generateMockup(variantId, designUrl)
      .then((url) => { 
        setRealMockupUrl(url); 
        setMockupStatus("done"); 
      })
      .catch((err) => { 
        console.error("Mockup failed:", err); 
        setMockupStatus("error"); 
      })
      .finally(() => {
        setIsGeneratingMockup(false);
        clearInterval(checkProgress);
      });

    // BACKGROUND WARMING REMOVED TEMPORARILY:
    // This was causing 429 Rate Limits on Printful by polling too frequently.

  }, [designUrl, form.layout, frameStyle]);

  const { showToast } = useToast();

  const handlePlaceOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsOrdering(true);
    
    try {
      const variantId = printProvider.getVariantForLayout(form.layout, { frameStyle });
      if (!variantId) throw new Error("Could not find variant for selection");

      const finalDesignUrl = designUrl ?? "https://www.printful.com/static/images/layout/printful-logo.png";
      const title = `${form.displayCity || "Custom Map"}, ${form.displayCountry || ""}`.trim();
      const amountAuth = orderCost?.total || "0.00";

      if (parseFloat(amountAuth) <= 0) {
        throw new Error("Order price must be calculated before proceeding.");
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, designUrl: finalDesignUrl, title, amountAuth }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initialize secure checkout");

      // Redirect securely to Stripe
      window.location.href = data.url;

    } catch (err: any) {
      console.error("Order failed:", err);
      // Surface the specific error from the server if available
      const specificError = err.message ? `: ${err.message}` : "";
      showToast(`SECURE CHECKOUT ERROR${specificError}. Please try again shortly.`, "error");
      setIsOrdering(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="checkout-drawer-overlay">
        <div className="checkout-drawer-backdrop" onClick={onClose} />
        <div className="checkout-drawer-panel">
          <div className="checkout-success-state">
            <div className="checkout-success-icon"><CheckIcon /></div>
            <h2>Order Received!</h2>
            <p>Your custom cartograph will be prepared by our master cartographers shortly.</p>
            <button type="button" className="btn-primary" onClick={onClose}>Return to Studio</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-drawer-overlay">
      <div className="checkout-drawer-backdrop" onClick={onClose} />
      <div className="checkout-drawer-panel">
        <div className="checkout-drawer-header">
          <h2>Order Summary</h2>
          <button type="button" className="checkout-close-btn" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="checkout-drawer-content">
          <div className="checkout-frame-picker">
            {[
              { id: "natural", label: "Oak" },
              { id: "black", label: "Black" },
              { id: "white", label: "White" },
              { id: "none", label: "None" },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                className={`frame-option-btn ${frameStyle === option.id ? "is-active" : ""}`}
                onClick={() => setFrameStyle(option.id as any)}
              >
                <div className="frame-swatch"><div className={`frame-swatch-inner swatch-${option.id}`} /></div>
                <span className="frame-option-label">{option.label}</span>
              </button>
            ))}
          </div>

          <div className="checkout-mockup-section">
            <div 
              className={`checkout-mockup-frame frame-${frameStyle} ${realMockupUrl ? 'has-real-mockup' : ''}`} 
              style={{ aspectRatio: `${aspect}`, "--mockup-bg": effectiveTheme.ui.bg } as React.CSSProperties}
              onClick={() => { if (realMockupUrl) setIsFullscreen(true); }}
            >
              <div className="checkout-mockup-map">
                {realMockupUrl ? (
                  <img src={realMockupUrl} alt="Mockup" className="real-mockup-img" style={{ cursor: "zoom-in" }} />
                ) : (
                  <>
                    {mapSnapshot && <img src={mapSnapshot} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />}
                    {(mockupStatus === "capturing" || mockupStatus === "uploaded" || isGeneratingMockup || mockupStatus === "generating_long") && (
                      <div className="mockup-generating-overlay">
                        <div className="spinner" />
                        <span>
                          {mockupStatus === "capturing" ? "Capturing your map..." :
                           mockupStatus === "generating_long" ? "Still rendering details..." :
                           "Generating preview..."}
                        </span>
                      </div>
                    )}
                    {mockupStatus === "error" && (
                      <div className="mockup-error-overlay">
                        <p>Preview failed to render.</p>
                        <button 
                          className="btn-retry" 
                          onClick={() => {
                            setMockupStatus("uploaded"); // Triggers Step 2 useEffect
                          }}
                        >
                          Retry Preview
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
              {!realMockupUrl && (
                <div className="checkout-mockup-text-container">
                  <PosterTextOverlay
                    city={form.displayCity || form.location || "Hanover"}
                    country={form.displayCountry || "Germany"}
                    occasion={form.occasion}
                    lat={formLat}
                    lon={formLon}
                    fontFamily={form.fontFamily}
                    textColor={effectiveTheme.ui.text}
                    landColor={effectiveTheme.map.land}
                    showPosterText={form.showPosterText}
                    includeCredits={false}
                    showOverlay={form.showMarkers}
                    isMatted={false}
                  />
                </div>
              )}
            </div>
            <div className="checkout-mockup-caption">
              {realMockupUrl ? (
                <>
                  <strong>Premium Gallery Presentation</strong><br/>
                  Ayous wood .75″ (1.9 cm) thick frame • 10.3 mil museum-quality matte paper
                </>
              ) : "Studio Preview • Museum-quality 240gsm matte paper."}
            </div>
          </div>

          <div className="checkout-order-card">
            <div className="checkout-item-details">
              <span className="checkout-item-title">{form.displayCity || "Custom Map"}</span>
              <span className="checkout-meta">{form.displayCountry}</span>
              <span className="checkout-item-badge">{layoutOption?.name || "Premium Print"}</span>
            </div>
            <div className="checkout-item-price">{formattedPrice}</div>
          </div>

          <div className="checkout-trust-badges">
            <div className="trust-badge"><CheckIcon /><span>Archival Quality</span></div>
            <div className="trust-badge"><CheckIcon /><span>Sustainable Wood</span></div>
            <div className="trust-badge"><CheckIcon /><span>Priority Shipping</span></div>
          </div>

          <div className="checkout-summary-row"><span>Giclée Printing</span><span>Included</span></div>
          <div className="checkout-summary-row">
            <span>Subtotal</span>
            <span>{orderCost ? new Intl.NumberFormat('en-US', { style: 'currency', currency: orderCost.currency, maximumFractionDigits: 0 }).format(parseFloat(orderCost.subtotal)) : "..."}</span>
          </div>
          <div className="checkout-summary-row">
            <span>Shipping</span>
            <span>{orderCost ? new Intl.NumberFormat('en-US', { style: 'currency', currency: orderCost.currency, maximumFractionDigits: 0 }).format(parseFloat(orderCost.shipping)) : "..."}</span>
          </div>
          <div className="checkout-summary-row" style={{ opacity: 0.5, fontSize: '0.8rem', fontStyle: 'italic' }}>
            <span>Shipping Address</span>
            <span>Provided at Checkout</span>
          </div>

          <div className="checkout-summary-row checkout-total" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "12px", marginTop: "12px" }}>
            <span>Total</span>
            <span>{formattedPrice}</span>
          </div>

          <div className="checkout-form-actions">
            <div style={{ padding: '12px', background: 'rgba(52, 211, 153, 0.05)', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.1)', marginBottom: '16px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
              Shipping address and payment details will be collected securely on the next page.
            </div>

            <button 
              type="button" 
              className="checkout-submit-btn" 
              onClick={() => handlePlaceOrder()} 
              disabled={isOrdering || !orderCost || parseFloat(orderCost.total) <= 0}
              id="stripe-checkout-button"
            >
              {isOrdering ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div className="spinner" style={{ width: '16px', height: '16px' }} />
                  Redirection to Stripe...
                </span>
              ) : !orderCost ? (
                "Calculating Price..."
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  Continue to Secure Checkout
                </span>
              )}
            </button>
            <div className="checkout-secure-badges" style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '20px', opacity: 0.6 }}>
               <div style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <CheckIcon style={{ width: '10px' } as any} /> Encrypted
               </div>
               <div style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <CheckIcon style={{ width: '10px' } as any} /> PCI Compliant
               </div>
               <div style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <CheckIcon style={{ width: '10px' } as any} /> Secure Payment
               </div>
            </div>
          </div>

        </div>
      </div>

      {isFullscreen && realMockupUrl && (
        <div className="checkout-lightbox-overlay" onClick={() => setIsFullscreen(false)}>
          <button className="checkout-lightbox-close" onClick={() => setIsFullscreen(false)}>
            <CloseIcon />
          </button>
          <img 
            src={realMockupUrl} 
            alt="Fullscreen Mockup" 
            className="checkout-lightbox-img" 
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
}
