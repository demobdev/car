import { createPortal } from "react-dom";
import { CloseIcon } from "./Icons";

interface AttributionModalProps {
  onClose: () => void;
}

export default function AttributionModal({ onClose }: AttributionModalProps) {
  return createPortal(
    <div
      className="about-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="about-modal attribution-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Data and technology attribution"
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

        <div className="attribution-modal-content">
          <h2>Attribution</h2>
          <p className="attribution-intro">
            Cartographica is made possible by these incredible open-source
            projects and data providers.
          </p>

          <table className="attribution-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Provider</th>
                <th>License</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Map Data</td>
                <td>
                  <a
                    href="https://www.openstreetmap.org/copyright"
                    target="_blank"
                    rel="noreferrer"
                  >
                    OpenStreetMap contributors
                  </a>
                </td>
                <td>ODbL</td>
              </tr>
              <tr>
                <td>Tile Schema</td>
                <td>
                  <a
                    href="https://openmaptiles.org/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    OpenMapTiles
                  </a>
                </td>
                <td>CC BY 4.0 / BSD-3</td>
              </tr>
              <tr>
                <td>Tile Hosting</td>
                <td>
                  <a
                    href="https://openfreemap.org/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    OpenFreeMap
                  </a>
                </td>
                <td>Free</td>
              </tr>
              <tr>
                <td>Map Rendering</td>
                <td>
                  <a
                    href="https://maplibre.org/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    MapLibre GL JS
                  </a>
                </td>
                <td>BSD-3-Clause</td>
              </tr>
              <tr>
                <td>Geocoding</td>
                <td>
                  <a
                    href="https://nominatim.openstreetmap.org/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Nominatim
                  </a>
                </td>
                <td>ODbL (OSM data)</td>
              </tr>
              <tr>
                <td>Source Code</td>
                <td>
                  <a
                    href="https://github.com/demobdev/car"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Cartographica
                  </a>
                </td>
                <td>AGPL-3.0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>,
    document.body,
  );
}
