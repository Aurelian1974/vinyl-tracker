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
    headers: { 'User-Agent': USER_AGENT },
    signal:  AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Discogs ${res.status}`);
  const data = await res.json() as { results?: DiscogsSearchResult[] };
  return data.results ?? [];
}

export async function getDiscogsRelease(releaseId: string): Promise<DiscogsRelease> {
  const res = await fetch(`${DISCOGS_BASE}/releases/${releaseId}`, {
    headers: { 'User-Agent': USER_AGENT },
    signal:  AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Discogs ${res.status}`);
  return res.json() as Promise<DiscogsRelease>;
}
