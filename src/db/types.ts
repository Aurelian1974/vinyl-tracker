export type RecordFormat   = 'LP' | 'EP' | '7"' | '10"' | '12"' | 'Box Set' | 'Single';
export type RecordStatus   = 'owned' | 'wishlist' | 'sold';
export type Currency       = 'RON' | 'EUR';
export type VinylCondition = 'M' | 'NM' | 'VG+' | 'VG' | 'G+' | 'G' | 'F' | 'P';
export type MediaType      = '33rpm' | '45rpm' | '78rpm';
export type PhotoType      = 'cover-front' | 'cover-back' | 'label-a' | 'label-b' | 'inner-sleeve' | 'other';

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
  // Extended collector fields (v2)
  pressingNotes?:    string;
  matrixNumber?:     string;
  mediaType?:        MediaType;
  color?:            string;
  isClean?:          boolean;
  playCount?:        number;
  lastPlayedAt?:     Date;
  personalRating?:   1 | 2 | 3 | 4 | 5;
  // Sell tracking (v2)
  soldPrice?:        number;
  soldDate?:         Date;
  soldTo?:           string;
}

export interface CoverImage {
  id?:        number;
  recordId:   number;
  photoType:  PhotoType;
  thumbnail:  Blob;
  full:       Blob;
  capturedAt: Date;
  source:     'camera' | 'discogs';
}

export interface PlayLog {
  id?:       number;
  recordId:  number;
  playedAt:  Date;
  notes?:    string;
}

export interface OfflineQueueItem {
  id?:       number;
  type:      'discogs-search' | 'discogs-barcode';
  payload:   string;
  createdAt: Date;
  retries:   number;
}
