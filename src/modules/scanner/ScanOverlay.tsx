export function ScanOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Dimmed background */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Scan frame */}
      <div className="relative w-72 h-36">
        {/* Corners */}
        <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
        <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
        <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
        <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />

        {/* Scan line */}
        <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500/70 animate-pulse" />

        {/* Cut-out: transparent */}
        <div className="absolute inset-0 bg-transparent" />
      </div>

      <p className="absolute bottom-32 text-white/70 text-sm">
        Îndreaptă camera spre codul de bare
      </p>
    </div>
  );
}
