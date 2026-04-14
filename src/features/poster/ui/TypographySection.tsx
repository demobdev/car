import { useEffect } from "react";
import { ensureGoogleFont } from "@/core/services";
import type { PosterForm } from "@/features/poster/application/posterReducer";
import type { FontOption } from "@/core/config";
import {
  PLACEHOLDER_EXAMPLE_CITY,
  PLACEHOLDER_EXAMPLE_COUNTRY,
} from "@/features/location/ui/constants";

interface TypographySectionProps {
  form: PosterForm;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  fontOptions: FontOption[];
  onApplyPreset?: (title: string, subtitle: string) => void;
}


export default function TypographySection({
  form,
  onChange,
  fontOptions,
  onApplyPreset,
}: TypographySectionProps) {
  useEffect(() => {
    const families = fontOptions
      .map((option) => String(option.value || "").trim())
      .filter(Boolean);

    void Promise.allSettled(families.map((family) => ensureGoogleFont(family)));
  }, [fontOptions]);

  return (
    <>
      <section className="panel-block">
        <p className="section-summary-label">STYLE</p>
        <label className="toggle-field">
          <span>Poster text</span>
          <span className="theme-switch">
            <input
              type="checkbox"
              name="showPosterText"
              checked={Boolean(form.showPosterText)}
              onChange={onChange}
            />
            <span className="theme-switch-track" aria-hidden="true" />
          </span>
        </label>
        <label className="toggle-field">
          <span>Overlay layer</span>
          <span className="theme-switch">
            <input
              type="checkbox"
              name="showMarkers"
              checked={Boolean(form.showMarkers)}
              onChange={onChange}
            />
            <span className="theme-switch-track" aria-hidden="true" />
          </span>
        </label>

        <label>
          Occasion Message
          <input
            className="form-control-tall"
            name="occasion"
            value={form.occasion}
            onChange={onChange}
            placeholder="e.g. THE DAY WE MET"
          />
        </label>

        <div className="field-grid keep-two-mobile">
          <label>
            City Name (Header 1)
            <input
              className="form-control-tall"
              name="displayCity"
              value={form.displayCity}
              onChange={onChange}
              placeholder={PLACEHOLDER_EXAMPLE_CITY}
            />
          </label>
          <label>
            Country Name (Header 2)
            <input
              className="form-control-tall"
              name="displayCountry"
              value={form.displayCountry}
              onChange={onChange}
              placeholder={PLACEHOLDER_EXAMPLE_COUNTRY}
            />
          </label>
        </div>

        {onApplyPreset && (
          <div className="occasion-presets-inline">
            <span className="preset-label" style={{display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted, #94a398)'}}>Occasion Presets:</span>
            <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem'}}>
              {[
                { label: "Where We Met", title: "WHERE WE MET", subtitle: "It started here" },
                { label: "Wedding Venue", title: "TYING THE KNOT", subtitle: "The perfect day" },
                { label: "First Home", title: "OUR FIRST HOME", subtitle: "Where memories began" },
              ].map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => onApplyPreset(p.title, p.subtitle)}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <label>
          Font
          <select
            className="form-control-tall"
            name="fontFamily"
            value={form.fontFamily}
            onChange={onChange}
          >
            {fontOptions.map((fontOption) => (
              <option
                key={fontOption.value || "default"}
                value={fontOption.value}
                style={{
                  fontFamily: fontOption.value
                    ? `"${fontOption.value}", "Space Grotesk", sans-serif`
                    : `"Space Grotesk", sans-serif`,
                }}
              >
                {fontOption.label}
              </option>
            ))}
          </select>
        </label>

      </section>
    </>
  );
}
