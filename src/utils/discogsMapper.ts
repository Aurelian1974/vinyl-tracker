import type { DiscogsSearchResult } from '@/services/discogs';
import type { RecordFormat, VinylRecord } from '@/db/types';

export function mapDiscogsToRecord(result: DiscogsSearchResult): Partial<VinylRecord> {
  const parts = result.title.split(' - ');
  const artist = parts[0]?.trim() ?? result.title;
  const title  = parts.slice(1).join(' - ').trim() || '';

  // Filtrăm imaginile placeholder Discogs (spacer.gif sau st.discogs.com)
  const coverUrl = result.cover_image &&
    !result.cover_image.includes('st.discogs.com') &&
    !result.cover_image.includes('spacer') &&
    result.cover_image.startsWith('https://i.discogs.com/')
      ? result.cover_image
      : undefined;

  return {
    artist,
    title,
    year:          result.year ? parseInt(result.year) : undefined,
    label:         result.label?.[0],
    catalogNumber: result.catno,
    genres:        result.genre,
    styles:        result.style,
    country:       result.country,
    discogsId:     String(result.id),
    discogsUrl:    result.resource_url,
    coverUrl,
    format:        mapFormat(result.format),
    currency:      'RON',
    status:        'owned',
    condition:     'VG+',
    createdAt:     new Date(),
    updatedAt:     new Date(),
  };
}

function mapFormat(formats?: string[]): RecordFormat {
  if (!formats) return 'LP';
  const f = formats.join(' ').toLowerCase();
  if (f.includes('7"') || f.includes('single')) return '7"';
  if (f.includes('10"'))                         return '10"';
  if (f.includes('12"') || f.includes('maxi'))   return '12"';
  if (f.includes('ep'))                          return 'EP';
  if (f.includes('box'))                         return 'Box Set';
  return 'LP';
}
