export interface DiscogsSearchResult {
  id:            number;
  title:         string;
  year?:         string;
  label?:        string[];
  catno?:        string;
  genre?:        string[];
  style?:        string[];
  country?:      string;
  format?:       string[];
  cover_image?:  string;
  resource_url:  string;
  type:          string;
}

export interface DiscogsRelease {
  id:             number;
  title:          string;
  artists?:       { name: string }[];
  year?:          number;
  labels?:        { name: string; catno: string }[];
  genres?:        string[];
  styles?:        string[];
  country?:       string;
  formats?:       { name: string; descriptions?: string[] }[];
  images?:        { uri: string; type: string }[];
  tracklist?:     { title: string; duration: string }[];
  notes?:         string;
}

const DISCOGS_BASE = 'https://api.discogs.com';
const USER_AGENT   = 'VinylTracker/1.0 +https://github.com/Aurelian1974/vinyl-tracker';

/** Returnează headerele HTTP pentru Discogs, cu token dacă e disponibil. */
function discogsHeaders(): Record<string, string> {
  const token = localStorage.getItem('discogs_token');
  const headers: Record<string, string> = { 'User-Agent': USER_AGENT };
  if (token) headers['Authorization'] = `Discogs token=${token}`;
  return headers;
}

interface SearchParams {
  barcode?: string;
  query?:   string;
  type?:    'release' | 'master';
}

export async function searchDiscogs({ barcode, query, type = 'release' }: SearchParams): Promise<DiscogsSearchResult[]> {
  const params = barcode
    ? `barcode=${barcode}&type=${type}`
    : `q=${encodeURIComponent(query ?? '')}&type=${type}`;

  const res = await fetch(`${DISCOGS_BASE}/database/search?${params}`, {
    headers: discogsHeaders(),
    signal:  AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Discogs ${res.status}`);
  const data = await res.json() as { results?: DiscogsSearchResult[] };
  return data.results ?? [];
}

export async function getDiscogsRelease(releaseId: string): Promise<DiscogsRelease> {
  const res = await fetch(`${DISCOGS_BASE}/releases/${releaseId}`, {
    headers: discogsHeaders(),
    signal:  AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Discogs ${res.status}`);
  return res.json() as Promise<DiscogsRelease>;
}

export async function searchDiscogsBarcode(barcode: string): Promise<DiscogsSearchResult | null> {
  const results = await searchDiscogs({ barcode });
  return results[0] ?? null;
}

export async function getDiscogsPriceSuggestion(
  releaseId: string
): Promise<Record<string, { currency: string; value: number }> | null> {
  if (!releaseId) return null;
  // Price suggestions necesită autentificare obligatoriu
  if (!localStorage.getItem('discogs_token')) return null;

  try {
    const res = await fetch(
      `${DISCOGS_BASE}/marketplace/price_suggestions/${releaseId}`,
      { headers: discogsHeaders(), signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    return res.json() as Promise<Record<string, { currency: string; value: number }>>;
  } catch {
    return null;
  }
}
