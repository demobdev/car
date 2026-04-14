/**
 * Printful Catalog Mapping (V2 Beta Alignment)
 * 
 * Maps Cartographica Layout IDs + Frame Styles to Printful V2 catalog_variant_ids.
 * These IDs are verified for Product 2 (Framed Poster) and Product 1 (Poster).
 */

export const PRINT_PROVIDER_MAP: Record<string, Record<string, number>> = {
  // Enhanced Matte Paper Series - 18x24" (3:4 Ratio)
  print_18x24_portrait: {
    none: 1,        // 18x24" Poster Only (Product 1)
    black: 3,       // 18x24" Black Frame (Product 2)
    white: 10749,   // 18x24" White Frame (Product 2)
    natural: 15031  // 18x24" Natural Frame (Product 2)
  },

  // Default Fallback
  default: {
    none: 1,
    black: 3,
    white: 10749,
    natural: 15031
  }
};

/**
 * Returns the Product ID associated with the variant.
 * For framed posters in V2 Beta, it's 2. For posters alone, it's 1.
 */
export function getPrintfulProductId(frameStyle: string): number {
  return frameStyle === "none" ? 1 : 2;
}

export function getPrintfulVariant(
  layoutId: string,
  frameStyle: "natural" | "black" | "white" | "none"
): number {
  const layoutMap = PRINT_PROVIDER_MAP[layoutId] || PRINT_PROVIDER_MAP.default;
  return layoutMap[frameStyle] || layoutMap.none;
}
