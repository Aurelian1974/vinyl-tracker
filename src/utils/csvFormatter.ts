import Papa from 'papaparse';
import type { VinylRecord } from '@/db/types';

export function exportToCSV(records: VinylRecord[]): string {
  const rows = records.map(r => ({
    Artist:    r.artist,
    Title:     r.title,
    Year:      r.year ?? '',
    Format:    r.format,
    Label:     r.label ?? '',
    Condition: r.condition,
    Price:     r.pricePaid ?? '',
    Currency:  r.currency,
    Status:    r.status,
  }));
  return Papa.unparse(rows);
}

export function exportToDiscogsCSV(records: VinylRecord[]): string {
  const owned = records.filter(r => r.status === 'owned');
  const rows = owned.map(r => ({
    'Catalog#':   r.catalogNumber ?? '',
    Artist:       r.artist,
    Title:        r.title,
    Label:        r.label ?? '',
    Format:       r.format,
    Rating:       '',
    Released:     r.year ?? '',
    release_id:   r.discogsId ?? '',
    Notes:        r.notes ?? '',
  }));
  return Papa.unparse(rows);
}

export function importFromDiscogsCSV(csv: string): Partial<VinylRecord>[] {
  const result = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  return result.data.map(row => ({
    artist:        row['Artist'] ?? '',
    title:         row['Title'] ?? '',
    year:          row['Released'] ? parseInt(row['Released']) : undefined,
    format:        (row['Format'] as VinylRecord['format']) ?? 'LP',
    label:         row['Label'] || undefined,
    catalogNumber: row['Catalog#'] || undefined,
    discogsId:     row['release_id'] || undefined,
    notes:         row['Notes'] || undefined,
    condition:     'VG+',
    currency:      'RON',
    status:        'owned',
    createdAt:     new Date(),
    updatedAt:     new Date(),
  }));
}
