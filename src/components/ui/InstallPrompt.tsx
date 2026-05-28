import { usePWAInstall } from '@/hooks/usePWAInstall';

export function InstallPrompt() {
  const { canInstall, install } = usePWAInstall();
  if (!canInstall) return null;

  return (
    <div className="mx-4 mt-4 bg-indigo-900/60 border border-indigo-700 rounded-xl p-4 flex items-center gap-4">
      <div className="flex-1">
        <p className="text-white font-medium text-sm">Instalează VinylTracker</p>
        <p className="text-indigo-300 text-xs mt-0.5">Acces rapid de pe ecranul principal</p>
      </div>
      <button
        onClick={install}
        className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg min-h-[44px] min-w-[44px]"
      >
        Instalează
      </button>
    </div>
  );
}
