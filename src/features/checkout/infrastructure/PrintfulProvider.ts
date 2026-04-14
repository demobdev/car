import type { IHttp } from "@/core/http/ports";
import { PRINTFUL_API_TOKEN } from "@/core/config";
import type { IPrintProvider, ShippingAddress, OrderCost, OrderResult } from "../domain/ports";
import { getPrintfulVariant, getPrintfulProductId } from "./printfulCatalog";

export class PrintfulProvider implements IPrintProvider {
  private readonly baseUrl = "/api/printful/v2";
  private mockupCache: Map<string, string> = new Map();

  constructor(private readonly http: IHttp) {
    // Hydrate cache from localStorage
    const saved = localStorage.getItem("cartographica_mockup_cache");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach(key => this.mockupCache.set(key, parsed[key]));
      } catch (e) {
        console.warn("Failed to hydrate mockup cache", e);
      }
    }
  }

  private persistCache() {
    const data: Record<string, string> = {};
    this.mockupCache.forEach((val, key) => data[key] = val);
    localStorage.setItem("cartographica_mockup_cache", JSON.stringify(data));
  }

  private get headers() {
    return {
      "Authorization": `Bearer ${PRINTFUL_API_TOKEN}`,
      "Content-Type": "application/json",
    };
  }

  getVariantForLayout(
    layoutId: string,
    options: { frameStyle: "natural" | "black" | "white" | "none" }
  ): string | null {
    const variantId = getPrintfulVariant(layoutId, options.frameStyle);
    return variantId ? String(variantId) : null;
  }

  async calculateOrderCost(
    variantId: string,
    address: ShippingAddress
  ): Promise<OrderCost> {
    const url = `${this.baseUrl}/catalog-variants/${variantId}/prices`;
    
    try {
      const response = await this.http.get(url, { headers: this.headers });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.detail || result.title || "Failed to fetch prices");
      }

      // IMPLEMENT FIXED RETAIL PRICE TIERS
      // We ignore wholesale fluctuations to keep a consistent brand MSRP
      // Variant 1 is the unframed poster. All others are framed.
      const isUnframed = variantId === "1";
      const retailSubtotal = isUnframed ? 45.00 : 60.00;
      const retailShipping = 10.00; 
      const retailTotal = retailSubtotal + retailShipping;

      return {
        subtotal: retailSubtotal.toFixed(2),
        discount: "0.00",
        shipping: retailShipping.toFixed(2),
        tax: "0.00",
        total: retailTotal.toFixed(2),
        currency: result.data.currency,
      };
    } catch (error) {
      console.error("Printful calculation error:", error);
      // Fallback to the same fixed tiers
      const isUnframed = variantId === "1";
      return {
        subtotal: isUnframed ? "45.00" : "60.00",
        discount: "0.00",
        shipping: "10.00",
        tax: "0.00",
        total: isUnframed ? "55.00" : "70.00",
        currency: "USD",
      };
    }
  }

  async createDraftOrder(
    variantId: string,
    designUrl: string,
    recipient: ShippingAddress
  ): Promise<OrderResult> {
    const url = `${this.baseUrl}/orders`;
    const payload = {
      recipient: {
        name: recipient.name,
        address1: recipient.address1,
        city: recipient.city,
        state_code: recipient.stateCode,
        country_code: recipient.countryCode,
        zip: recipient.zip,
      },
      order_items: [
        {
          source: "catalog",
          catalog_variant_id: parseInt(variantId, 10),
          quantity: 1,
          placements: [
            {
              placement: "default",
              technique: "digital", 
              layers: [
                {
                  type: "file",
                  url: designUrl,
                },
              ],
            },
          ],
        },
      ],
    };

    const response = await this.http.post(url, JSON.stringify(payload), { headers: this.headers });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.detail || result.title || "Failed to create draft order");
    }

    return {
      id: result.data.id,
      status: result.data.status,
      previewUrl: result.data.order_items[0]?.placements[0]?.layers[0]?.url,
    };
  }

  getCachedMockup(variantId: string, designUrl: string): string | null {
    const cacheKey = `${variantId}-${designUrl}`;
    return this.mockupCache.get(cacheKey) || null;
  }

  async generateMockup(
    variantId: string,
    designUrl: string
  ): Promise<string> {
    const cacheKey = `${variantId}-${designUrl}`;
    
    // LAYER 1: Browser-local Cache (Instant)
    const cachedLocal = this.getCachedMockup(variantId, designUrl);
    if (cachedLocal) {
      console.log(`[Cache L1] Hit for ${variantId}`);
      return cachedLocal;
    }

    // LAYER 2: Global Supabase Cache (Shared)
    try {
      const sbUrl = import.meta.env.VITE_SUPABASE_URL;
      const sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (sbUrl && sbKey) {
        const checkRes = await fetch(`${sbUrl}/rest/v1/mockup_cache?design_url=eq.${encodeURIComponent(designUrl)}&variant_id=eq.${variantId}&select=mockup_url`, {
          headers: { "apikey": sbKey, "Authorization": `Bearer ${sbKey}` }
        });
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.length > 0) {
            const globalUrl = checkData[0].mockup_url;
            console.log(`[Cache L2] Global Hit for ${variantId}`);
            // Backfill L1
            this.mockupCache.set(cacheKey, globalUrl);
            this.persistCache();
            return globalUrl;
          }
        }
      }
    } catch (e) {
      console.warn("[Cache L2] Supabase lookup failed", e);
    }

    // FALLBACK: Heavy Printful Render (Slow)
    const url = `${this.baseUrl}/mockup-tasks`;
    const numericVariantId = parseInt(variantId, 10);
    const productId = numericVariantId === 1 ? 1 : 2; 
    
    const payload = {
      format: "jpg",
      products: [
        {
          source: "catalog",
          catalog_product_id: productId,
          catalog_variant_ids: [numericVariantId],
          placements: [
            {
              placement: "default",
              technique: "digital",
              layers: [{ type: "file", url: designUrl }]
            }
          ]
        }
      ]
    };

    try {
      const response = await this.http.post(url, JSON.stringify(payload), { headers: this.headers });
      const startResult = await response.json();
      
      if (!response.ok) {
        throw new Error(startResult.detail || startResult.title || "Failed to start mockup task");
      }
      
      const taskId = Array.isArray(startResult.data) ? startResult.data[0]?.id : startResult.data?.id;

      for (let i = 0; i < 60; i++) {
        await new Promise(resolve => setTimeout(resolve, i < 5 ? 2000 : 3000)); 
        
        const statusRes = await this.http.get(`${this.baseUrl}/mockup-tasks?id=${taskId}`, { headers: this.headers });
        if (!statusRes.ok) continue; 

        const statusResult = await statusRes.json();
        const task = statusResult.data?.[0];
        
        if (task?.status === "completed") {
          const mockupUrl = task.catalog_variant_mockups?.[0]?.mockups?.[0]?.mockup_url;
          if (mockupUrl) {
            console.log(`[Printful] Render complete for ${variantId}`);
            
            // Save to L1
            this.mockupCache.set(cacheKey, mockupUrl);
            this.persistCache();

            // Save to L2 (Global)
            const sbUrl = import.meta.env.VITE_SUPABASE_URL;
            const sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            if (sbUrl && sbKey) {
              fetch(`${sbUrl}/rest/v1/mockup_cache`, {
                method: "POST",
                headers: { "apikey": sbKey, "Authorization": `Bearer ${sbKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({ design_url: designUrl, variant_id: variantId, mockup_url: mockupUrl })
              }).catch(e => console.error("[Cache L2] Failed to save", e));
            }

            return mockupUrl;
          }
        }
        if (task?.status === "failed") throw new Error("Mockup generation failed on Printful server");
      }
      throw new Error("Mockup generation timed out.");
    } catch (error: any) {
      console.error("Mockup Provider Error:", error.message);
      throw error;
    }
  }
}
