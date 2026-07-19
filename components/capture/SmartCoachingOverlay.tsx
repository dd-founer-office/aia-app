interface SmartCoachingOverlayProps {
  message: string | null;
}

export function SmartCoachingOverlay({ message }: SmartCoachingOverlayProps) {
  if (!message) return null;
  return (
    <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2">
      <span className="rounded-full bg-black/55 px-3 py-1.5 text-xs text-white">{message}</span>
    </div>
  );
}
