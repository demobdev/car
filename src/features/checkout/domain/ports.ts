export interface ShippingAddress {
  name: string;
  email: string;
  address1: string;
  city: string;
  stateCode?: string;
  countryCode: string;
  zip: string;
}

export interface OrderCost {
  subtotal: string;
  discount: string;
  shipping: string;
  tax: string;
  total: string;
  currency: string;
}

export interface OrderResult {
  id: string;
  status: string;
  previewUrl?: string;
}

export interface IPrintProvider {
  /**
   * Resolves a Printful catalog variant ID based on layout and frame style.
   */
  getVariantForLayout(
    layoutId: string,
    options: { frameStyle: "natural" | "black" | "white" | "none" }
  ): string | null;

  /**
   * Calculates the estimated cost for an order.
   */
  calculateOrderCost(
    variantId: string,
    address: ShippingAddress
  ): Promise<OrderCost>;

  /**
   * Creates a draft order in Printful.
   */
  createDraftOrder(
    variantId: string,
    designUrl: string,
    recipient: ShippingAddress
  ): Promise<OrderResult>;

  /**
   * Generates a photorealistic mockup image URL (async).
   */
  generateMockup(
    variantId: string,
    designUrl: string
  ): Promise<string>;

  /**
   * Synchronously checks if a mockup for the given variant/design already exists in the cache.
   */
  getCachedMockup(variantId: string, designUrl: string): string | null;
}

