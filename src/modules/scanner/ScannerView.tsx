import { useNavigate } from '@tanstack/react-router';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { ScanOverlay } from './ScanOverlay';
import { ConditionBadge } from '@/components/ui/ConditionBadge';
import type { VinylRecord } from '@/db/types';
import type { DiscogsSearchResult } from '@/services/discogs';

export function ScannerView() {
  const navigate = useNavigate();
  const {
    videoRef, engine, lastBarcode, existingRecord, wishlistMatch,
    discogsResult, isSearching, cameraError, reset,
  } = useBarcodeScanner();

  const goAdd = (barcode: string, discogs?: DiscogsSearchResult) => {
    void navigate({ to: '/add', search: { barcode, q: discogs?.title } });
  };

  if (cameraError) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white/60 text-sm px-8 text-center">
        {cameraError}
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />

      {!lastBarcode && <ScanOverlay />}

      {/* Engine badge — visible only in development */}
      {import.meta.env.DEV && engine !== 'detecting' && (
        <span className="absolute top-3 right-3 z-20 text-[10px] text-white/25 font-mono">
          {engine}
        </span>
      )}

      {/* Back button */}
      <button
        onClick={() => navigate({ to: '/' })}
        className="absolute top-4 left-4 z-20 bg-black/60 text-white rounded-full p-3 min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Searching */}
      {isSearching && (
        <ResultOverlay>
          <div className="flex items-center gap-3 text-white">
            <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p>Căutare {lastBarcode}...</p>
          </div>
        </ResultOverlay>
      )}

      {/* Already owned */}
      {existingRecord && !isSearching && (
        <ResultOverlay>
          <OwnedCard record={existingRecord} onReset={reset}
            onDetail={() => navigate({ to: '/collection/$id', params: { id: String(existingRecord.id) } })} />
        </ResultOverlay>
      )}

      {/* Wishlist match */}
      {wishlistMatch && !existingRecord && !isSearching && (
        <ResultOverlay>
          <WishlistCard record={wishlistMatch} onReset={reset}
            onAdd={() => goAdd(lastBarcode!, discogsResult ?? undefined)} />
        </ResultOverlay>
      )}

      {/* Discogs result / not found */}
      {!existingRecord && !wishlistMatch && !isSearching && lastBarcode && (
        <ResultOverlay>
          {discogsResult ? (
            <div className="space-y-3">
              <p className="text-white font-medium">Găsit pe Discogs</p>
              <button onClick={() => goAdd(lastBarcode, discogsResult)}
                className="w-full flex items-center gap-3 bg-white/10 rounded-xl p-3 text-left min-h-[60px]">
                {discogsResult.cover_image && (
                  <img src={discogsResult.cover_image} alt="" className="w-12 h-12 rounded object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{discogsResult.title}</p>
                  <p className="text-white/60 text-xs">{[discogsResult.year, discogsResult.country].filter(Boolean).join(' · ')}</p>
                </div>
              </button>
              <ResetButton onReset={reset} />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-white text-center">Barcode: {lastBarcode}</p>
              <p className="text-white/60 text-sm text-center">Niciun rezultat Discogs</p>
              <ActionButtons
                onReset={reset}
                onManual={() => navigate({ to: '/add', search: { barcode: lastBarcode ?? '', q: undefined } })}
              />
            </div>
          )}
        </ResultOverlay>
      )}
    </div>
  );
}

function ResultOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 bg-slate-900/95 backdrop-blur rounded-t-2xl p-5">
      {children}
    </div>
  );
}

function OwnedCard({ record, onReset, onDetail }: { record: VinylRecord; onReset: () => void; onDetail: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-green-400 font-semibold">
        <span className="text-2xl">✓</span>
        <span>Deja în colecție</span>
      </div>
      <div>
        <p className="text-white font-medium">{record.artist} — {record.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <ConditionBadge condition={record.condition} />
          {record.pricePaid && <span className="text-slate-400 text-xs">{record.pricePaid} {record.currency}</span>}
          {record.purchaseLocation && <span className="text-slate-400 text-xs">{record.purchaseLocation}</span>}
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onDetail}
          className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-medium min-h-[48px]">
          Detalii
        </button>
        <ResetButton onReset={onReset} />
      </div>
    </div>
  );
}

function WishlistCard({ record, onReset, onAdd }: { record: VinylRecord; onReset: () => void; onAdd: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-yellow-400 font-semibold">
        <span className="text-2xl">🎯</span>
        <span>Pe wishlist!</span>
      </div>
      <div>
        <p className="text-white font-medium">{record.artist} — {record.title}</p>
        {record.maxBuyPrice && (
          <p className="text-green-400 text-sm mt-1">Max preț: {record.maxBuyPrice} {record.currency}</p>
        )}
      </div>
      <div className="flex gap-3">
        <button onClick={onAdd}
          className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-medium min-h-[48px]">
          Adaugă în colecție
        </button>
        <ResetButton onReset={onReset} />
      </div>
    </div>
  );
}

function ActionButtons({ onReset, onManual }: { onReset: () => void; onManual: () => void }) {
  return (
    <div className="flex gap-3">
      <button onClick={onManual}
        className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-medium min-h-[48px]">
        Adaugă manual
      </button>
      <ResetButton onReset={onReset} />
    </div>
  );
}

function ResetButton({ onReset }: { onReset: () => void }) {
  return (
    <button onClick={onReset}
      className="px-4 py-3 border border-slate-700 text-slate-300 rounded-xl min-h-[48px]">
      Scanează din nou
    </button>
  );
}
