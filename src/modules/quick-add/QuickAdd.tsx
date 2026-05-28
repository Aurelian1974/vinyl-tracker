import { useState, useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { db } from '@/db/db';
import type { VinylRecord, RecordFormat, VinylCondition, Currency } from '@/db/types';
import { ConditionSelector } from './ConditionSelector';
import { DiscogsResultList } from './DiscogsResultList';
import { searchDiscogs, type DiscogsSearchResult } from '@/services/discogs';
import { mapDiscogsToRecord } from '@/utils/discogsMapper';
import { useAppStore } from '@/stores/useAppStore';
import { ALL_CONDITIONS } from '@/utils/vinylGrading';

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
  const [isSearching,    setIsSearching]    = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [dupCheck,       setDupCheck]       = useState<'none' | 'owned' | 'wishlist'>('none');

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

  // Dup check
  useEffect(() => {
    if (!artist && !title) { setDupCheck('none'); return; }
    void (async () => {
      const all = await db.records.toArray();
      const match = all.find(
        r => r.artist.toLowerCase() === artist.toLowerCase() &&
             r.title.toLowerCase()  === title.toLowerCase()
      );
      if (!match) setDupCheck('none');
      else setDupCheck(match.status === 'wishlist' ? 'wishlist' : 'owned');
    })();
  }, [artist, title]);

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
      createdAt:       new Date(),
      updatedAt:       new Date(),
    };

    try {
      await db.records.add(record);
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

      <form onSubmit={handleSave} className="p-4 space-y-5 pb-24">
        {/* Duplicate warning */}
        {dupCheck === 'owned' && (
          <div className="flex items-center gap-2 bg-amber-900/40 border border-amber-700 rounded-xl px-4 py-3 text-amber-300 text-sm">
            ⚠ Ai deja acest vinil în colecție!
          </div>
        )}
        {dupCheck === 'wishlist' && (
          <div className="flex items-center gap-2 bg-blue-900/40 border border-blue-700 rounded-xl px-4 py-3 text-blue-300 text-sm">
            🎯 Este pe wishlist!
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
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur border-t border-slate-800">
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
