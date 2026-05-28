export type RecordFormat  = 'LP' | 'EP' | '7"' | '10"' | '12"' | 'Box Set' | 'Single';
export type RecordStatus  = 'owned' | 'wishlist' | 'sold';
export type Currency      = 'RON' | 'EUR';
export type VinylCondition = 'M' | 'NM' | 'VG+' | 'VG' | 'G+' | 'G' | 'F' | 'P';

export interface VinylRecord {
  id?:               number;
  barcode?:          string;
  discogsId?:        string;
  discogsUrl?:       string;
  artist:            string;
  title:             string;
  year?:             number;
  format:            RecordFormat;
  label?:            string;
  catalogNumber?:    string;
  genres?:           string[];
  styles?:           string[];
  country?:          string;
  condition:         VinylCondition;
  sleeveCondition?:  VinylCondition;
  pricePaid?:        number;
  currency:          Currency;
  purchaseDate?:     Date;
  purchaseLocation?: string;
  status:            RecordStatus;
  wishlistPriority?: 1 | 2 | 3;
  maxBuyPrice?:      number;
  notes?:            string;
  coverUrl?:         string;
  createdAt:         Date;
  updatedAt:         Date;
}

export interface CoverImage {
  id?:        number;
  recordId:   number;
  thumbnail:  Blob;
  full:       Blob;
  capturedAt: Date;
  source:     'camera' | 'discogs';
}

export interface OfflineQueueItem {
  id?:       number;
  type:      'discogs-search' | 'discogs-barcode';
  payload:   string;
  createdAt: Date;
  retries:   number;
}
