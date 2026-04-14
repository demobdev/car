import { createPortal } from "react-dom";
import { CloseIcon } from "./Icons";

interface LicensesModalProps {
  onClose: () => void;
}

export default function LicensesModal({ onClose }: LicensesModalProps) {
  return createPortal(
    <div
      className="about-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="about-modal licenses-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Open-source licenses"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="about-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <CloseIcon />
        </button>

        <div className="licenses-modal-content">
          <h2>Open-Source Licenses</h2>

          <section className="license-section">
            <h3>Cartographica</h3>
            <p>
              Cartographica is based on the{" "}
              <a
                href="https://github.com/mfranzreb/terraink"
                target="_blank"
                rel="noreferrer"
              >
                Cartographica
              </a>{" "}
              open-source project, licensed under the{" "}
              <strong>GNU Affero General Public License v3.0 (AGPL-3.0)</strong>.
            </p>
            <p>
              The full text of the AGPL-3.0 license is available at{" "}
              <a
                href="https://www.gnu.org/licenses/agpl-3.0.en.html"
                target="_blank"
                rel="noreferrer"
              >
                gnu.org/licenses/agpl-3.0
              </a>
              .
            </p>
          </section>

          <section className="license-section">
            <h3>OpenStreetMap</h3>
            <p>
              Map data is provided by{" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
              >
                OpenStreetMap contributors
              </a>
              , available under the{" "}
              <strong>Open Data Commons Open Database License (ODbL)</strong>.
            </p>
          </section>

          <section className="license-section">
            <h3>OpenMapTiles</h3>
            <p>
              Vector tile schema by{" "}
              <a
                href="https://openmaptiles.org/"
                target="_blank"
                rel="noreferrer"
              >
                OpenMapTiles
              </a>
              , licensed under{" "}
              <strong>CC BY 4.0</strong> (design) and <strong>BSD-3-Clause</strong> (code).
            </p>
          </section>

          <section className="license-section">
            <h3>OpenFreeMap</h3>
            <p>
              Free tile hosting provided by{" "}
              <a
                href="https://openfreemap.org/"
                target="_blank"
                rel="noreferrer"
              >
                OpenFreeMap
              </a>
              .
            </p>
          </section>

          <section className="license-section">
            <h3>MapLibre GL JS</h3>
            <p>
              Map rendering powered by{" "}
              <a
                href="https://maplibre.org/"
                target="_blank"
                rel="noreferrer"
              >
                MapLibre GL JS
              </a>
              , licensed under the <strong>BSD-3-Clause</strong> license.
            </p>
          </section>

          <section className="license-section">
            <h3>Nominatim</h3>
            <p>
              Geocoding provided by{" "}
              <a
                href="https://nominatim.openstreetmap.org/"
                target="_blank"
                rel="noreferrer"
              >
                Nominatim
              </a>
              , using OpenStreetMap data (ODbL).
            </p>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
