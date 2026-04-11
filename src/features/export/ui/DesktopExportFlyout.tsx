import { useEffect, useState } from "react";
import { useExport } from "@/features/export/application/useExport";
import type { ExportFormat } from "@/features/export/domain/types";
import { DownloadIcon, LoaderIcon } from "@/shared/ui/Icons";
import SupportModal from "@/features/export/ui/SupportModal";

const FLYOUT_FORMATS: { format: ExportFormat; label: string }[] = [
  { format: "svg", label: "RSVG" },
  { format: "pdf", label: "PDF" },
];

export default function DesktopExportFlyout() {
  const { isExporting, exportPoster, supportPrompt, dismissSupportPrompt } =
    useExport();
  const [activeFormat, setActiveFormat] = useState<ExportFormat | null>(null);

  useEffect(() => {
    if (!isExporting) setActiveFormat(null);
  }, [isExporting]);

  const runExport = (format: ExportFormat) => {
    setActiveFormat(format);
    void exportPoster(format);
  };

  return (
    <>
      <div className={`desktop-export-fab${isExporting ? " is-exporting" : ""}`}>
        <div className="desktop-export-flyout">
          {FLYOUT_FORMATS.map(({ format, label }) => (
            <button
              key={format}
              type="button"
              className={`desktop-export-btn desktop-export-btn--${format}`}
              disabled={isExporting}
              onClick={() => runExport(format)}
            >
              {isExporting && activeFormat === format
                ? <LoaderIcon className="desktop-export-btn-icon is-spinning" />
                : <DownloadIcon className="desktop-export-btn-icon" />}
              <span>{label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="desktop-export-btn desktop-export-btn--primary"
          disabled={isExporting}
          onClick={() => runExport("png")}
        >
          {isExporting && activeFormat === "png"
            ? <LoaderIcon className="desktop-export-btn-icon is-spinning" />
            : <DownloadIcon className="desktop-export-btn-icon" />}
          <span className="desktop-export-label-default">Download</span>
          <span className="desktop-export-label-hover">PNG</span>
        </button>
      </div>

      {supportPrompt ? (
        <SupportModal
          posterNumber={supportPrompt.posterNumber}
          onClose={dismissSupportPrompt}
          titleId="fab-export-support-modal-title"
        />
      ) : null}
    </>
  );
}
