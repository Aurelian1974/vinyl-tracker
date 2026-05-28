import type { VinylCondition } from '@/db/types';

export const VINYL_CONDITIONS: Record<VinylCondition, { label: string; description: string; color: string }> = {
  'M':   { label: 'Mint',           description: 'Neatins, ca nou din fabrică',           color: 'emerald' },
  'NM':  { label: 'Near Mint',      description: 'Aproape perfect, urmă minimă de ac',    color: 'green' },
  'VG+': { label: 'Very Good Plus', description: 'Ușoară uzură, sunet excelent',          color: 'lime' },
  'VG':  { label: 'Very Good',      description: 'Zgârieturi vizibile, zgomot de fundal', color: 'yellow' },
  'G+':  { label: 'Good Plus',      description: 'Uzură semnificativă, ascultabil',       color: 'orange' },
  'G':   { label: 'Good',           description: 'Foarte uzat, colecție/completare',      color: 'red' },
  'F':   { label: 'Fair',           description: 'Deteriorat, abia ascultabil',           color: 'red' },
  'P':   { label: 'Poor',           description: 'Inutilizabil, doar copertă',            color: 'gray' },
};

export const ALL_CONDITIONS: VinylCondition[] = ['M', 'NM', 'VG+', 'VG', 'G+', 'G', 'F', 'P'];
