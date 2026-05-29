import { useState, useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { db } from '@/db/db';
import type { VinylRecord, RecordFormat, VinylCondition, Currency } from '@/db/types';
import { ConditionSelector } from './ConditionSelector';
import { DiscogsResultList } from './DiscogsResultList';
import { searchDiscogs, getDiscogsPriceSuggestion, type DiscogsSearchResult } from '@/services/discogs';
import { mapDiscogsToRecord } from '@/utils/discogsMapper';
import { useAppStore } from '@/stores/useAppStore';
import { useDuplicateCheck } from '@/hooks/useDuplicateCheck';
import { precacheDiscogCovers } from '@/services/coverCache';
import { ALL_CONDITIONS } from '@/utils/vinylGrading';
import { autoSave } from '@/services/localSync';

const FORMATS: RecordFormat[] = ['LP', 'EP', '7"', '10"', '12"', 'Box Set', 'Single'];

export function QuickAdd() {
  const navigate  = useNavigate();
  const search    = useSearch({ from: '/add' }) as { q?: string; barcode?: string };
  const { lastPurchaseLocation, defaultCurrency, setLastLocation } = useAppStore();

  const [artist,   setArtist]   = useState('');
  const [title,    setTitle]    = useState('');
  const [year,     setYear]     = useState('');
  const [format,   setFormat]   = useState<RecordFormat>('LP');
  const [label,    setLabel]    = useState('');
  const [catNo,    setCatNo]    = useState('');
  const [cond,     setCond]     = useState<VinylCondition>('VG+');
  const [sleeveC,  setSleeveC]  = useState<VinylCondition>('VG+');
  const [price,    setPrice]    = useState('');
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [location, setLocation] = useState(lastPurchaseLocation);
  const [notes,    setNotes]    = useState('');
  const [barcode,  setBarcode]  = useState('');
  const [discogsId, setDiscogsId] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  const [discogsQuery,   setDiscogsQuery]   = useState('');
  const [discogsResults, setDiscogsResults] = useState<DiscogsSearchResult[]>([]);
  const [isSearching,     setIsSearching]     = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [priceSuggestion, setPriceSuggestion] = useState<Record<string, { currency: string; value: number }> | null>(null);
  const [pressingNotes,   setPressingNotes]   = useState('');
  const [matrixNumber,    setMatrixNumber]    = useState('');

  const duplicates = useDuplicateCheck(artist, title, barcode || undefined);

  // Pre-fill from query params
  useEffect(() => {
    if (search.q) setDiscogsQuery(search.q);
    if (search.barcode) setBarcode(search.barcode);
  }, [search.q, search.barcode]);

  // Discogs search debounce
  useEffect(() => {
    if (!discogsQuery.trim()) { setDiscogsResults([]); return; }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchDiscogs({ query: discogsQuery });
        setDiscogsResults(results.slice(0, 15));
      } catch {
        setDiscogsResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [discogsQuery]);

  const applyDiscogs = (r: DiscogsSearchResult) => {
    const mapped = mapDiscogsToRecord(r);
    if (mapped.artist)        setArtist(mapped.artist);
    if (mapped.title)         setTitle(mapped.title);
    if (mapped.year)          setYear(String(mapped.year));
    if (mapped.format)        setFormat(mapped.format);
    if (mapped.label)         setLabel(mapped.label);
    if (mapped.catalogNumber) setCatNo(mapped.catalogNumber);
    if (mapped.discogsId)     setDiscogsId(mapped.discogsId);
    if (mapped.coverUrl)      setCoverUrl(mapped.coverUrl ?? '');
    setDiscogsResults([]);
    setDiscogsQuery('');
    // Fetch price suggestion for selected release
    if (mapped.discogsId) {
      void getDiscogsPriceSuggestion(mapped.discogsId).then(data => {
        setPriceSuggestion(data);
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist.trim() || !title.trim()) return;
    setSaving(true);

    const record: VinylRecord = {
      artist:          artist.trim(),
      title:           title.trim(),
      year:            year ? parseInt(year) : undefined,
      format,
      label:           label || undefined,
      catalogNumber:   catNo || undefined,
      condition:       cond,
      sleeveCondition: sleeveC,
      pricePaid:       price ? parseFloat(price) : undefined,
      currency,
      purchaseLocation: location || undefined,
      status:          'owned',
      notes:           notes || undefined,
      barcode:         barcode || undefined,
      discogsId:       discogsId || undefined,
      coverUrl:        coverUrl || undefined,
      pressingNotes:   pressingNotes || undefined,
      matrixNumber:    matrixNumber  || undefined,
      createdAt:       new Date(),
      updatedAt:       new Date(),
    };

    try {
      await db.records.add(record);
      void autoSave();
      // Pre-cache coperta imediat (SW — opaque fetch, funcționează fără CORS)
      if (record.coverUrl) void precacheDiscogCovers([record.coverUrl]);
      if (location) setLastLocation(location);
      navigator.vibrate?.(80);
      await navigate({ to: '/collection' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate({ to: '/' })} className="p-2 -ml-2 text-slate-400 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold flex-1">Adaugă vinil</h1>
      </header>

      <form onSubmit={handleSave} className="p-4 space-y-5 pb-40">
        {/* Fuzzy duplicate warnings */}
        {duplicates.length > 0 && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 space-y-1.5">
            {duplicates.map(d => (
              <div key={d.record.id} className="flex items-center justify-between">
                <span className="text-xs text-amber-400">
                  {d.type === 'exact-barcode' ? '⚠ Ai exact acest vinil' :
                   d.type === 'wishlist'      ? '🎯 Pe wishlist' :
                                                '≈ Posibil duplicat'}
                  {' '}<span className="text-white/40">{d.record.artist} — {d.record.title}</span>
                </span>
                <span className="text-xs text-white/40 shrink-0 ml-2">
                  {d.record.condition}{d.record.pricePaid ? ` · ${d.record.pricePaid} ${d.record.currency}` : ''}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Discogs search */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Caută pe Discogs</label>
          <input
            type="search"
            value={discogsQuery}
            onChange={e => setDiscogsQuery(e.target.value)}
            placeholder="Artist + titlu pentru auto-completare..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-base text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Barcode */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Barcode</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              placeholder="EAN-13 / UPC-A"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-base text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => navigate({ to: '/scanner' })}
              className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl px-4 py-3 text-white min-h-[52px] min-w-[52px] flex items-center justify-center transition-colors"
              title="Scanează barcode"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4v1M4 12h1M20 12h-1M12 20v-1M6.34 6.34l.7.7M17.66 6.34l-.7.7M6.34 17.66l.7-.7M17.66 17.66l-.7-.7" />
                <rect x="9" y="9" width="6" height="6" rx="1" strokeWidth={2} />
              </svg>
            </button>
          </div>
          {barcode && (
            <p className="text-xs text-indigo-400 mt-1">📷 Barcode scanat: {barcode}</p>
          )}
        </div>

        <DiscogsResultList results={discogsResults} onSelect={applyDiscogs} isLoading={isSearching} />

        {/* Artist */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Artist *</label>
          <input
            required
            type="text"
            value={artist}
            onChange={e => setArtist(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-base text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Titlu *</label>
          <input
            required
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-base text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Year + Format */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">An</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(e.target.value)}
              min={1900} max={2030}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-base text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Format</label>
            <select
              value={format}
              onChange={e => setFormat(e.target.value as RecordFormat)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-base text-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        {/* Label + CatNo */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Label</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-base text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Nr. catalog</label>
            <input
              type="text"
              value={catNo}
              onChange={e => setCatNo(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-base text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Condition disc */}
        <ConditionSelector value={cond} onChange={setCond} label="Condiție disc *" />

        {/* Sleeve condition */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Condiție copertă</label>
          <div className="grid grid-cols-4 gap-2">
            {ALL_CONDITIONS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setSleeveC(c)}
                className={`py-2 rounded-lg border text-sm font-bold min-h-[44px] transition-all ${
                  c === sleeveC
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                    : 'border-slate-700 bg-slate-800 text-slate-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Preț plătit</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              min={0} step={0.01}
              placeholder="0"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-base text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value as Currency)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="RON">RON</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          {priceSuggestion && priceSuggestion[cond] && (
            <p className="text-xs text-white/40 mt-1.5">
              Discogs median ({cond}):{' '}
              <span className="text-white/70 font-medium">
                {priceSuggestion[cond].value.toFixed(0)} {priceSuggestion[cond].currency}
              </span>
            </p>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Locație</label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="ex: Obor, Piața Romană..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-base text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Pressing notes + matrix */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Presare / notă</label>
            <input
              type="text"
              value={pressingNotes}
              onChange={e => setPressingNotes(e.target.value)}
              placeholder="ex: 1st UK, German"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-base text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Matrix</label>
            <input
              type="text"
              value={matrixNumber}
              onChange={e => setMatrixNumber(e.target.value)}
              placeholder="ex: A1/B1"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-base text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Note</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-base text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Submit */}
        <div className="fixed bottom-14 left-0 right-0 z-40 p-4 bg-slate-900/95 backdrop-blur border-t border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-semibold py-4 rounded-xl text-base min-h-[52px] transition-colors"
          >
            {saving ? 'Se salvează...' : 'Salvează în colecție'}
          </button>
        </div>
      </form>
    </div>
  );
}
