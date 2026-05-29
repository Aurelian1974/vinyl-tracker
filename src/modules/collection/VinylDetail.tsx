import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { CoverImage } from '@/components/ui/CoverImage';
import { ConditionBadge } from '@/components/ui/ConditionBadge';
import { useCoverCapture } from '@/hooks/useCoverCapture';
import type { PhotoType } from '@/db/types';

const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  'cover-front':  'Față',
  'cover-back':   'Spate',
  'label-a':      'Label A',
  'label-b':      'Label B',
  'inner-sleeve': 'Inner',
  'other':        'Altul',
};

export function VinylDetail() {
  const navigate    = useNavigate();
  const { id }      = useParams({ from: '/collection/$id' });
  const recordId    = parseInt(id);
  const [confirm,   setConfirm]   = useState(false);
  const [showSell,  setShowSell]  = useState(false);
  const [soldPrice, setSoldPrice] = useState('');
  const [soldTo,    setSoldTo]    = useState('');
  const [soldDate,  setSoldDate]  = useState(() => new Date().toISOString().slice(0, 10));

  const record = useLiveQuery(() => db.records.get(recordId), [recordId]);
  const photos = useLiveQuery(
    () => db.coverImages.where('recordId').equals(recordId).toArray(),
    [recordId]
  ) ?? [];

  const { capture, CameraInput } = useCoverCapture(recordId);

  if (!record) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Vinil negăsit
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm) { setConfirm(true); return; }
    await db.records.delete(recordId);
    await db.coverImages.where('recordId').equals(recordId).delete();
    navigator.vibrate?.(80);
    await navigate({ to: '/collection' });
  };

  const handleListenLog = async () => {
    await db.playLogs.add({ recordId: record!.id!, playedAt: new Date() });
    await db.records.update(recordId, {
      playCount:    (record!.playCount ?? 0) + 1,
      lastPlayedAt: new Date(),
    });
    navigator.vibrate?.(30);
  };

  const handleSell = async () => {
    const price = parseFloat(soldPrice);
    await db.records.update(recordId, {
      status:    'sold',
      soldPrice: isNaN(price) ? undefined : price,
      soldDate:  soldDate ? new Date(soldDate) : undefined,
      soldTo:    soldTo.trim() || undefined,
    });
    setShowSell(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate({ to: '/collection' })}
          className="p-2 -ml-2 text-slate-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold flex-1 truncate">{record.artist}</h1>
        <button
          onClick={handleDelete}
          className={`text-sm px-3 py-2 rounded-lg min-h-[44px] transition-colors ${
            confirm ? 'bg-red-600 text-white' : 'text-red-400'
          }`}
        >
          {confirm ? 'Confirmă' : 'Șterge'}
        </button>
      </header>

      {/* Cover */}
      <div className="relative">
        <CoverImage
          recordId={record.id}
          coverUrl={record.coverUrl}
          alt={`${record.artist} – ${record.title}`}
          size="full"
          className="w-full aspect-square"
        />
        <button
          onClick={capture}
          className="absolute bottom-4 right-4 bg-black/70 text-white rounded-full p-3 min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Fotografiază coperta"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <circle cx="12" cy="13" r="3" strokeWidth={2} />
          </svg>
        </button>
        <CameraInput />
      </div>

      {/* Details */}
      <div className="p-4 space-y-4">
        <div>
          <h2 className="text-2xl font-bold">{record.title}</h2>
          <p className="text-slate-400 text-lg">{record.artist}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ConditionBadge condition={record.condition} size="md" />
          {record.sleeveCondition && (
            <span className="text-xs text-slate-400 self-center">
              Copertă: <ConditionBadge condition={record.sleeveCondition} size="sm" />
            </span>
          )}
          <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-1 rounded-full text-slate-300">
            {record.format}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {record.year && <InfoTile label="An" value={String(record.year)} />}
          {record.label && <InfoTile label="Label" value={record.label} />}
          {record.catalogNumber && <InfoTile label="Catalog" value={record.catalogNumber} />}
          {record.country && <InfoTile label="Țară" value={record.country} />}
          {record.pricePaid != null && (
            <InfoTile label="Preț plătit" value={`${record.pricePaid} ${record.currency}`} />
          )}
          {record.purchaseLocation && <InfoTile label="Locație" value={record.purchaseLocation} />}
          {record.purchaseDate && (
            <InfoTile label="Data achiziției" value={new Date(record.purchaseDate).toLocaleDateString('ro-RO')} />
          )}
        </div>

        {record.genres?.length ? (
          <div>
            <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wide">Genuri</p>
            <div className="flex flex-wrap gap-1.5">
              {record.genres.map(g => (
                <span key={g} className="text-xs bg-slate-800 border border-slate-700 px-2 py-1 rounded-full text-slate-300">{g}</span>
              ))}
              {record.styles?.map(s => (
                <span key={s} className="text-xs bg-slate-800 border border-slate-700 px-2 py-1 rounded-full text-slate-400">{s}</span>
              ))}
            </div>
          </div>
        ) : null}

        {record.notes && (
          <div>
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide">Note</p>
            <p className="text-slate-300 text-sm">{record.notes}</p>
          </div>
        )}

        {/* Multi-photo strip */}
        {photos.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Fotografii</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {photos.map(p => (
                <PhotoThumb key={p.id} photo={p} />
              ))}
            </div>
          </div>
        )}

        {/* Play count */}
        <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
          <div>
            <p className="text-xs text-slate-500">Ascultări</p>
            <p className="text-white text-sm font-medium">
              {record.playCount ?? 0}
              {record.lastPlayedAt && (
                <span className="text-slate-500 text-xs ml-2">
                  ultima: {new Date(record.lastPlayedAt).toLocaleDateString('ro-RO')}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleListenLog}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium active:bg-indigo-700 min-h-[44px]"
          >
            🎵 Am ascultat
          </button>
        </div>

        {/* Sell tracking */}
        {record.status !== 'sold' && (
          <>
            {!showSell ? (
              <button
                onClick={() => setShowSell(true)}
                className="w-full py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-sm active:bg-slate-700"
              >
                Marchează ca vândut
              </button>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-white">Detalii vânzare</p>
                <input
                  type="number"
                  placeholder="Preț vânzare"
                  value={soldPrice}
                  onChange={e => setSoldPrice(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Vândut lui... (opțional)"
                  value={soldTo}
                  onChange={e => setSoldTo(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="date"
                  value={soldDate}
                  onChange={e => setSoldDate(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSell(false)}
                    className="flex-1 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-300 text-sm"
                  >
                    Anulează
                  </button>
                  <button
                    onClick={handleSell}
                    className="flex-1 py-2 rounded-lg bg-green-700 text-white text-sm font-medium active:bg-green-800"
                  >
                    Confirmă
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {record.status === 'sold' && record.soldPrice != null && (
          <div className="bg-green-900/20 border border-green-700/30 rounded-xl px-4 py-3">
            <p className="text-xs text-green-400 uppercase tracking-wide mb-1">Vândut</p>
            <p className="text-white text-sm">
              {record.soldPrice} {record.currency}
              {record.soldDate && (
                <span className="text-slate-400 ml-2">
                  — {new Date(record.soldDate).toLocaleDateString('ro-RO')}
                </span>
              )}
              {record.soldTo && <span className="text-slate-400 ml-1">→ {record.soldTo}</span>}
            </p>
            {record.pricePaid != null && (
              <p className={`text-xs mt-1 ${record.soldPrice >= record.pricePaid ? 'text-green-400' : 'text-red-400'}`}>
                Profit: {(record.soldPrice - record.pricePaid).toFixed(2)} {record.currency}
              </p>
            )}
          </div>
        )}

        {record.discogsUrl && (
          <a
            href={record.discogsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-indigo-400 text-sm py-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Vezi pe Discogs
          </a>
        )}
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-white text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}

function PhotoThumb({ photo }: { photo: import('@/db/types').CoverImage }) {
  const [src, setSrc] = useState<string | null>(null);
  // Convert Blob to object URL
  useState(() => {
    const url = URL.createObjectURL(photo.thumbnail);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  });
  if (!src) return null;
  return (
    <div className="shrink-0 text-center">
      <img
        src={src}
        alt={PHOTO_TYPE_LABELS[photo.photoType] ?? photo.photoType}
        className="w-20 h-20 object-cover rounded-lg border border-slate-700"
      />
      <span className="text-xs text-slate-500 block mt-1">
        {PHOTO_TYPE_LABELS[photo.photoType] ?? photo.photoType}
      </span>
    </div>
  );
}
