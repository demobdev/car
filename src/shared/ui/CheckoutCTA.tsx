/**
 * Checkout CTA placeholder.
 *
 * Renders a styled "Order Print" button that shows a coming-soon message.
 * TODO: Connect to Stripe or print provider checkout flow.
 */

import { useState } from "react";

export default function CheckoutCTA() {
  const [showMessage, setShowMessage] = useState(false);

  return (
    <div className="checkout-cta-wrap">
      <button
        type="button"
        className="checkout-cta-btn"
        onClick={() => setShowMessage(true)}
      >
        🖨️ Order a Print
      </button>

      {showMessage ? (
        <div className="checkout-cta-toast" role="status">
          <p>
            Print ordering is <strong>coming soon</strong>. For now, export your
            design and use your favourite print service!
          </p>
          <button
            type="button"
            className="checkout-cta-toast-close"
            onClick={() => setShowMessage(false)}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ) : null}
    </div>
  );
}
