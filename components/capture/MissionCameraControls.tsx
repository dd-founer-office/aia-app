import { Grid3x3, Zap, ZapOff, RefreshCw } from "lucide-react";

interface MissionCameraControlsProps {
  gridOn: boolean;
  onToggleGrid: () => void;
  torchSupported: boolean;
  torchOn: boolean;
  onToggleTorch: () => void;
  zoom: number;
  onSetZoom: (z: number) => void;
  onSwitchCamera: () => void;
  onCapture: () => void;
  captureDisabled: boolean;
}

const LENS_OPTIONS = [0.5, 1, 2];

/** Mission Camera Constitution P5 — evidence-first controls only. No ISO/RAW/manual exposure. */
export function MissionCameraControls({
  gridOn,
  onToggleGrid,
  torchSupported,
  torchOn,
  onToggleTorch,
  zoom,
  onSetZoom,
  onSwitchCamera,
  onCapture,
  captureDisabled,
}: MissionCameraControlsProps) {
  return (
    <div className="flex flex-col gap-4 px-5 pb-6 pt-4">
      <div className="flex items-center justify-center gap-1">
        {LENS_OPTIONS.map((lens) => (
          <button
            key={lens}
            type="button"
            onClick={() => onSetZoom(lens)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              zoom === lens ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]" : "bg-black/40 text-white"
            }`}
          >
            {lens}×
          </button>
        ))}
      </div>

      <div className="grid grid-cols-5 items-center">
        <div className="flex justify-start">
          <button
            type="button"
            onClick={onToggleGrid}
            aria-label="Toggle rule of thirds grid"
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              gridOn ? "bg-[var(--color-primary)] text-white" : "bg-black/40 text-white"
            }`}
          >
            <Grid3x3 size={18} />
          </button>
        </div>

        <div className="col-span-3 flex justify-center">
          <button
            type="button"
            onClick={onCapture}
            disabled={captureDisabled}
            aria-label="Capture"
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 disabled:opacity-40"
          >
            <span className="h-12 w-12 rounded-full bg-white" />
          </button>
        </div>

        <div className="flex justify-end gap-2">
          {torchSupported && (
            <button
              type="button"
              onClick={onToggleTorch}
              aria-label="Toggle flash"
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                torchOn ? "bg-[var(--color-primary)] text-white" : "bg-black/40 text-white"
              }`}
            >
              {torchOn ? <Zap size={18} /> : <ZapOff size={18} />}
            </button>
          )}
          <button
            type="button"
            onClick={onSwitchCamera}
            aria-label="Switch camera"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
