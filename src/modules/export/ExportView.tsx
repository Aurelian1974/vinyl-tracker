import { useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { exportToCSV, exportToDiscogsCSV, importFromDiscogsCSV } from '@/utils/csvFormatter';
import { StorageIndicator } from '@/components/ui/StorageIndicator';
import { useAppStore } from '@/stores/useAppStore';
import { useDiscogCovers } from '@/hooks/useDiscogCovers';
import { useSessionBudget } from '@/hooks/useSessionBudget';
import type { Currency } from '@/db/types';

export function SettingsView() {
  const navigate = useNavigate();
  const fileRef  = useRef<HTMLInputElement>(null);
  const [msg, setMsg]               = useState('');
  const [discogsToken, setDiscogsToken] = useState(() => localStorage.getItem('discogs_token') ?? '');
  const [budgetInput, setBudgetInput]   = useState('');
  const { defaultCurrency, setDefaultCurrency } = useAppStore();
  const budget = useSessionBudget();

  const records = useLiveQuery(() => db.records.toArray(), []) ?? [];

  const toast = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const downloadFile = (content: string, filename: string, type = 'text/csv') => {
    const blob = new Blob([content], { type });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!records.length) { toast('Nicio înregistrare de exportat'); return; }
    downloadFile(exportToCSV(records), 'vinyl-tracker-export.csv');
    toast('Export CSV descărcat');
  };

  const handleExportDiscogsCSV = () => {
    if (!records.length) { toast('Nicio înregistrare de exportat'); return; }
    downloadFile(exportToDiscogsCSV(records), 'vinyl-tracker-discogs.csv');
    toast('Export Discogs CSV descărcat');
  };

  const handleExportJSON = async () => {
    const covers = await db.coverImages.toArray();
    const coversBase64 = await Promise.all(
      covers.map(async c => ({
        ...c,
        thumbnail: await blobToBase64(c.thumbnail),
        full:      await blobToBase64(c.full),
      }))
    );
    const json = JSON.stringify({ records, covers: coversBase64 }, null, 2);
    downloadFile(json, 'vinyl-tracker-backup.json', 'application/json');
    toast('Backup JSON descărcat');
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const imported = importFromDiscogsCSV(text);
    if (!imported.length) { toast('Nicio înregistrare importată'); return; }
    await db.records.bulkAdd(imported as Parameters<typeof db.records.bulkAdd>[0]);
    toast(`${imported.length} înregistrări importate`);
    e.target.value = '';
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const json = JSON.parse(await file.text()) as {
        records?: unknown[];
        covers?: Array<{ thumbnail: string; full: string } & Record<string, unknown>>;
      };
      if (json.records?.length) {
        await db.records.bulkAdd(json.records as Parameters<typeof db.records.bulkAdd>[0]);
      }
      if (json.covers?.length) {
        const covers = await Promise.all(
          json.covers.map(async c => ({
            ...c,
            thumbnail: await base64ToBlob(c.thumbnail as string),
            full:      await base64ToBlob(c.full as string),
          }))
        );
        await db.coverImages.bulkAdd(covers as unknown as Parameters<typeof db.coverImages.bulkAdd>[0]);
      }
      toast('Backup restaurat cu succes');
    } catch {
      toast('Eroare la import — fișier invalid');
    }
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate({ to: '/' })} className="p-2 -ml-2 text-slate-400 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">Setări & Export</h1>
      </header>

      {msg && (
        <div className="mx-4 mt-3 bg-indigo-900/60 border border-indigo-700 text-indigo-300 px-4 py-3 rounded-xl text-sm">
          {msg}
        </div>
      )}

      <div className="p-4 space-y-6 pb-24">
        {/* Storage */}
        <Section title="Stocare">
          <StorageIndicator />
          <p className="text-slate-500 text-xs mt-2">{records.length} înregistrări în baza de date</p>
        </Section>

        {/* Coperte offline */}
        <Section title="Coperte offline">
          <CoverCacheSection />
        </Section>

        {/* Preferences */}
        <Section title="Preferințe">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Monedă implicită</span>
            <select
              value={defaultCurrency}
              onChange={e => setDefaultCurrency(e.target.value as Currency)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="RON">RON</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </Section>

        {/* Discogs token */}
        <Section title="Discogs API">
          <div className="space-y-2">
            {!discogsToken && (
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                <span className="text-amber-400 mt-0.5">⚠️</span>
                <p className="text-xs text-amber-300">
                  Fără token, copertele Discogs <strong>nu se afișează</strong>. Adaugă un token pentru a vedea copertele în colecție.
                </p>
              </div>
            )}
            <p className="text-xs text-slate-400">
              Personal Access Token — necesar pentru coperte și sugestii de preț.{' '}
              <a href="https://www.discogs.com/settings/developers" target="_blank" rel="noopener noreferrer"
                 className="text-indigo-400 underline">
                Generează token
              </a>
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={discogsToken}
                onChange={e => setDiscogsToken(e.target.value)}
                placeholder="token Discogs..."
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => {
                  if (discogsToken.trim()) {
                    localStorage.setItem('discogs_token', discogsToken.trim());
                  } else {
                    localStorage.removeItem('discogs_token');
                  }
                  toast('Token salvat');
                }}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm active:bg-slate-600"
              >
                Salvează
              </button>
            </div>
          </div>
        </Section>

        {/* Export */}
        <Section title="Buget sesiune">
          <div className="space-y-3">
            {budget.active ? (
              <>
                <div className={`text-sm font-mono tabular-nums ${budget.overBudget ? 'text-red-400' : 'text-slate-300'}`}>
                  Cheltuit: {budget.spent.toFixed(2)} / {budget.limit} RON
                  {budget.overBudget && <span className="ml-2 text-xs text-red-400">DEPĂȘIT!</span>}
                </div>
                <button
                  onClick={budget.endSession}
                  className="w-full py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-300 text-sm active:bg-slate-600"
                >
                  Închide sesiunea
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder={`Limită (ex. ${budget.limit})`}
                  value={budgetInput}
                  onChange={e => setBudgetInput(e.target.value)}
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => {
                    const limit = parseFloat(budgetInput);
                    if (limit > 0) budget.setBudgetLimit(limit);
                    budget.startSession();
                    setBudgetInput('');
                  }}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium active:bg-indigo-700"
                >
                  Start
                </button>
              </div>
            )}
          </div>
        </Section>

        {/* Export */}
        <Section title="Export">
          <div className="space-y-2">
            <ActionButton onClick={handleExportCSV} label="Export CSV simplu" desc="artist, titlu, an, condiție, preț" />
            <ActionButton onClick={handleExportDiscogsCSV} label="Export Discogs CSV" desc="format compatibil import Discogs" />
            <ActionButton onClick={handleExportJSON} label="Backup complet JSON" desc="include coperte (base64)" />
          </div>
        </Section>

        {/* Import */}
        <Section title="Import">
          <div className="space-y-2">
            <ActionButton
              onClick={() => fileRef.current?.click()}
              label="Import Discogs CSV"
              desc="din exportul de colecție sau wantlist Discogs"
            />
            <ActionButton
              onClick={() => {
                const inp = document.createElement('input');
                inp.type = 'file'; inp.accept = '.json';
                inp.onchange = handleImportJSON as unknown as EventListener;
                inp.click();
              }}
              label="Restaurare backup JSON"
              desc="din backup-ul propriu VinylTracker"
            />
            <input ref={fileRef} type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </div>
        </Section>
      </div>
    </div>
  );
}

function CoverCacheSection() {
  const { totalCovers, isCaching, cachedCount, cacheAllCovers } = useDiscogCovers();

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-300">Coperte Discogs offline</p>
        <p className="text-slate-500 text-xs mt-0.5">
          {totalCovers} viniluri cu copertă Discogs
          {cachedCount > 0 && ` — ${cachedCount} descărcate`}
        </p>
      </div>
      <button
        onClick={() => void cacheAllCovers()}
        disabled={isCaching || totalCovers === 0}
        className="px-3 py-1.5 text-xs rounded-md bg-slate-700 text-white
                   disabled:opacity-40 disabled:cursor-not-allowed
                   active:bg-slate-600 transition-colors"
      >
        {isCaching ? 'Se descarcă...' : 'Descarcă toate'}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-3">{title}</h2>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
        {children}
      </div>
    </div>
  );
}

function ActionButton({ onClick, label, desc }: { onClick: () => void; label: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-4 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl transition-colors min-h-[56px]"
    >
      <p className="text-white text-sm font-medium">{label}</p>
      <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
    </button>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

async function base64ToBlob(base64: string): Promise<Blob> {
  const res = await fetch(base64);
  return res.blob();
}
