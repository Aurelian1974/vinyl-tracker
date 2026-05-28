import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from '@tanstack/react-router';
import { db } from '@/db/db';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export function StatsView() {
  const navigate = useNavigate();
  const records = useLiveQuery(() => db.records.toArray(), []) ?? [];

  const owned    = records.filter(r => r.status === 'owned');
  const wishlist = records.filter(r => r.status === 'wishlist');

  const totalRON = owned.filter(r => r.currency === 'RON' && r.pricePaid).reduce((s, r) => s + (r.pricePaid ?? 0), 0);
  const totalEUR = owned.filter(r => r.currency === 'EUR' && r.pricePaid).reduce((s, r) => s + (r.pricePaid ?? 0), 0);

  const mostExpensive = [...owned].sort((a, b) => (b.pricePaid ?? 0) - (a.pricePaid ?? 0))[0];
  const cheapest      = [...owned].filter(r => r.pricePaid).sort((a, b) => (a.pricePaid ?? 0) - (b.pricePaid ?? 0))[0];

  // Condition distribution
  const condDist = ['M', 'NM', 'VG+', 'VG', 'G+', 'G', 'F', 'P'].map(c => ({
    name: c,
    count: owned.filter(r => r.condition === c).length,
  })).filter(d => d.count > 0);

  // Genre breakdown
  const genreMap = new Map<string, number>();
  for (const r of owned) {
    for (const g of r.genres ?? []) {
      genreMap.set(g, (genreMap.get(g) ?? 0) + 1);
    }
  }
  const genreData = [...genreMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  // Per year
  const yearMap = new Map<number, number>();
  for (const r of owned) {
    if (r.purchaseDate) {
      const y = new Date(r.purchaseDate).getFullYear();
      yearMap.set(y, (yearMap.get(y) ?? 0) + 1);
    }
  }
  const yearData = [...yearMap.entries()].sort((a, b) => a[0] - b[0]).map(([year, count]) => ({ year, count }));

  // Top locations
  const locMap = new Map<string, number>();
  for (const r of owned) {
    if (r.purchaseLocation) locMap.set(r.purchaseLocation, (locMap.get(r.purchaseLocation) ?? 0) + 1);
  }
  const topLocations = [...locMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate({ to: '/' })} className="p-2 -ml-2 text-slate-400 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">Statistici</h1>
      </header>

      <div className="p-4 space-y-6 pb-24">
        {/* Summary tiles */}
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Viniluri" value={String(owned.length)} icon="💿" />
          <StatTile label="Wishlist" value={String(wishlist.length)} icon="🎯" />
          {totalRON > 0 && <StatTile label="Total RON" value={`${totalRON.toFixed(0)} RON`} icon="💰" />}
          {totalEUR > 0 && <StatTile label="Total EUR" value={`${totalEUR.toFixed(0)} EUR`} icon="💶" />}
        </div>

        {mostExpensive && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Cel mai scump</p>
            <p className="text-white font-medium">{mostExpensive.artist} — {mostExpensive.title}</p>
            <p className="text-yellow-400 text-sm">{mostExpensive.pricePaid} {mostExpensive.currency}</p>
          </div>
        )}

        {cheapest && cheapest !== mostExpensive && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Cel mai ieftin</p>
            <p className="text-white font-medium">{cheapest.artist} — {cheapest.title}</p>
            <p className="text-green-400 text-sm">{cheapest.pricePaid} {cheapest.currency}</p>
          </div>
        )}

        {/* Condition bar chart */}
        {condDist.length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-3">Distribuție condiție</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={condDist}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Genre pie */}
        {genreData.length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-3">Top genuri</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={genreData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {genreData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Per-year line chart */}
        {yearData.length > 1 && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-3">Achiziții pe an</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={yearData}>
                <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top locations */}
        {topLocations.length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-3">Locații frecvente</p>
            <div className="space-y-2">
              {topLocations.map(([loc, count]) => (
                <div key={loc} className="flex items-center justify-between">
                  <span className="text-white text-sm">{loc}</span>
                  <span className="text-slate-400 text-sm">{count} viniluri</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-white font-bold text-lg">{value}</p>
      </div>
    </div>
  );
}
