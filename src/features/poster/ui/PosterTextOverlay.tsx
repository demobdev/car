import { formatCoordinates } from "@/shared/geo/posterBounds";
import { APP_CREDIT_URL } from "@/core/config";
import {
  TEXT_DIMENSION_REFERENCE_PX,
  TEXT_OCCASION_Y_RATIO,
  TEXT_CITY_Y_RATIO,
  TEXT_DIVIDER_Y_RATIO,
  TEXT_COUNTRY_Y_RATIO,
  TEXT_COORDS_Y_RATIO,
  TEXT_EDGE_MARGIN_RATIO,
  CITY_FONT_BASE_PX,
  COUNTRY_FONT_BASE_PX,
  COORDS_FONT_BASE_PX,
  ATTRIBUTION_FONT_BASE_PX,
  formatCityLabel,
  computeCityFontScale,
  computeAttributionColor,
} from "@/features/poster/domain/textLayout";

interface PosterTextOverlayProps {
  city: string;
  country: string;
  occasion?: string;
  locationText?: string;
  lat: number;
  lon: number;
  fontFamily: string;
  textColor: string;
  landColor: string;
  showPosterText: boolean;
  includeCredits: boolean;
  showOverlay: boolean;
  isMatted?: boolean;
}

/**
 * DOM-based poster text overlay (sharp at any resolution, GPU-composited).
 * Renders city name, divider, country, coordinates, and attribution
 * positioned to match the canvas export layout exactly.
 */
export default function PosterTextOverlay({
  city,
  country,
  occasion,
  locationText,
  lat,
  lon,
  fontFamily,
  textColor,
  landColor,
  showPosterText,
  includeCredits,
  showOverlay,
  isMatted = false,
}: PosterTextOverlayProps) {
  const toCqMin = (px: number) => (px / TEXT_DIMENSION_REFERENCE_PX) * 100;

  const titleFont = fontFamily
    ? `"${fontFamily}", "Space Grotesk", sans-serif`
    : '"Space Grotesk", sans-serif';
  const bodyFont = fontFamily
    ? `"${fontFamily}", "IBM Plex Mono", monospace`
    : '"IBM Plex Mono", monospace';

  const cityLabel = formatCityLabel(city);
  const cityFontSize = `${toCqMin(CITY_FONT_BASE_PX) * computeCityFontScale(city)}cqmin`;
  const countryFontSize = `${toCqMin(COUNTRY_FONT_BASE_PX)}cqmin`;
  const coordsFontSize = `${toCqMin(COORDS_FONT_BASE_PX)}cqmin`;
  const attributionFontSize = `${toCqMin(ATTRIBUTION_FONT_BASE_PX)}cqmin`;
  
  // Logic overrides for matted layout
  const activeTextColor = isMatted ? "#1a1a1a" : textColor;
  const attributionColor = isMatted ? "#1a1a1a" : computeAttributionColor(textColor, landColor, showOverlay);
  const attributionOpacity = isMatted ? 0.4 : (showOverlay ? 0.55 : 0.9);

  return (
    <div className={`poster-text-overlay ${isMatted ? 'is-matted' : ''}`} style={{ color: activeTextColor }}>
      {showPosterText && (
        <>
          {occasion && (
            <p
              className="poster-occasion"
              style={{
                fontFamily: titleFont,
                top: `${TEXT_OCCASION_Y_RATIO * 100}%`,
                fontSize: `${toCqMin(COUNTRY_FONT_BASE_PX) * 0.8}cqmin`,
                fontWeight: 500,
                opacity: 0.9
              }}
            >
              {occasion.toUpperCase()}
            </p>
          )}
          <p
            className="poster-city"
            style={{
              fontFamily: titleFont,
              top: isMatted ? "auto" : `${TEXT_CITY_Y_RATIO * 100}%`,
              bottom: isMatted ? "6.0%" : "auto",
              fontSize: isMatted ? `${toCqMin(CITY_FONT_BASE_PX) * 0.65}cqmin` : cityFontSize,
            }}
          >
            {cityLabel}
          </p>
          <hr
            className="poster-divider"
            style={{
              borderColor: activeTextColor,
              top: isMatted ? "auto" : `${TEXT_DIVIDER_Y_RATIO * 100}%`,
              bottom: isMatted ? "6.1%" : "auto",
              width: isMatted ? "15%" : undefined,
              transform: isMatted ? "translateX(15%)" : undefined
            }}
          />
          <p
            className="poster-country"
            style={{
              fontFamily: titleFont,
              top: isMatted ? "auto" : `${TEXT_COUNTRY_Y_RATIO * 100}%`,
              bottom: isMatted ? "3.0%" : "auto",
              fontSize: isMatted ? `${toCqMin(COUNTRY_FONT_BASE_PX) * 0.75}cqmin` : countryFontSize,
            }}
          >
            {country.toUpperCase()}
          </p>
          <p
            className="poster-coords"
            style={{
              fontFamily: bodyFont,
              top: isMatted ? "auto" : `${TEXT_COORDS_Y_RATIO * 100}%`,
              bottom: isMatted ? "1.5%" : "auto",
              fontSize: isMatted ? `${toCqMin(COORDS_FONT_BASE_PX) * 0.9}cqmin` : coordsFontSize,
            }}
          >
            {locationText ? `${locationText.split(",").slice(0, 2).join(",")}  |  ` : ""}
            {formatCoordinates(lat, lon)}
          </p>
        </>
      )}

      <span
        className="poster-attribution"
        style={{
          fontFamily: bodyFont,
          color: attributionColor,
          opacity: attributionOpacity,
          fontSize: attributionFontSize,
          bottom: isMatted ? "0.6%" : `${TEXT_EDGE_MARGIN_RATIO * 100}%`,
          right: isMatted ? "1%" : `${TEXT_EDGE_MARGIN_RATIO * 100}%`,
        }}
      >
        &copy; OpenStreetMap contributors
      </span>

      {includeCredits && (
        <span
          className="poster-credits"
          style={{
            fontFamily: bodyFont,
            color: attributionColor,
            opacity: attributionOpacity,
            fontSize: attributionFontSize,
            bottom: `${TEXT_EDGE_MARGIN_RATIO * 100}%`,
            left: `${TEXT_EDGE_MARGIN_RATIO * 100}%`,
          }}
        >
          © {APP_CREDIT_URL}
        </span>
      )}
    </div>
  );
}
