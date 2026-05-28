import { db } from './db';
import type { VinylRecord } from './types';

export async function seedDatabase() {
  const count = await db.records.count();
  if (count > 0) return;

  const seeds: VinylRecord[] = [
    {
      artist: 'Metallica',
      title: 'Master of Puppets',
      year: 1986,
      format: 'LP',
      label: 'Elektra',
      catalogNumber: '60439-1',
      genres: ['Rock'],
      styles: ['Heavy Metal', 'Thrash'],
      country: 'US',
      condition: 'VG+',
      pricePaid: 80,
      currency: 'RON',
      purchaseDate: new Date('2023-06-15'),
      purchaseLocation: 'Obor',
      status: 'owned',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      artist: 'Pink Floyd',
      title: 'The Dark Side of the Moon',
      year: 1973,
      format: 'LP',
      label: 'Harvest',
      genres: ['Rock'],
      styles: ['Psychedelic Rock', 'Prog Rock'],
      condition: 'NM',
      pricePaid: 150,
      currency: 'RON',
      purchaseDate: new Date('2024-01-10'),
      purchaseLocation: 'Piața Romană',
      status: 'owned',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      artist: 'Led Zeppelin',
      title: 'Led Zeppelin IV',
      year: 1971,
      format: 'LP',
      label: 'Atlantic',
      genres: ['Rock'],
      styles: ['Hard Rock', 'Blues Rock'],
      condition: 'VG',
      status: 'wishlist',
      wishlistPriority: 1,
      maxBuyPrice: 100,
      currency: 'RON',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  await db.records.bulkAdd(seeds);
}
