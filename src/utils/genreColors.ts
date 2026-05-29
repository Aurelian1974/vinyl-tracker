/** Left-border Tailwind color classes keyed by Discogs genre name. */
export const GENRE_COLORS: Record<string, string> = {
  'Rock':                  'border-l-orange-500',
  'Electronic':            'border-l-cyan-500',
  'Pop':                   'border-l-pink-500',
  'Jazz':                  'border-l-yellow-500',
  'Classical':             'border-l-violet-500',
  'Hip Hop':               'border-l-green-500',
  'Funk / Soul':           'border-l-amber-500',
  'Reggae':                'border-l-lime-500',
  'Blues':                 'border-l-blue-500',
  'Latin':                 'border-l-red-500',
  'Folk, World, & Country':'border-l-emerald-600',
  'Stage & Screen':        'border-l-fuchsia-500',
  "Children's":            'border-l-sky-400',
  'Brass & Military':      'border-l-zinc-400',
  'Non-Music':             'border-l-stone-500',
};

export function getGenreColor(genres?: string[]): string {
  if (!genres?.length) return 'border-l-white/10';
  return GENRE_COLORS[genres[0]] ?? 'border-l-white/10';
}
