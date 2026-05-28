import { useState, useCallback } from 'react';
import { useZxing } from 'react-zxing';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { searchDiscogs, type DiscogsSearchResult } from '@/services/discogs';
import { queueBarcode } from '@/services/offlineQueue';

export function useBarcodeScanner() {
  const [lastBarcode, setLastBarcode]     = useState<string | null>(null);
  const [discogsResults, setDiscogsResults] = useState<DiscogsSearchResult[]>([]);
  const [isSearching, setIsSearching]     = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const existingRecord = useLiveQuery(
    () => lastBarcode
      ? db.records.where('barcode').equals(lastBarcode).first()
      : undefined,
    [lastBarcode]
  );

  const wishlistMatch = useLiveQuery(
    () => lastBarcode
      ? db.records
          .where('barcode').equals(lastBarcode)
          .and(r => r.status === 'wishlist')
          .first()
      : undefined,
    [lastBarcode]
  );

  const handleDecode = useCallback(async (barcode: string) => {
    if (barcode === lastBarcode) return;
    navigator.vibrate?.(80);
    setLastBarcode(barcode);
    setDiscogsResults([]);
    setError(null);

    setIsSearching(true);
    try {
      const results = await searchDiscogs({ barcode });
      setDiscogsResults(results);
    } catch {
      if (!navigator.onLine) {
        await queueBarcode(barcode);
        setError('Offline — codul a fost salvat pentru căutare ulterioară');
      } else {
        setError('Eroare la căutarea Discogs');
      }
    } finally {
      setIsSearching(false);
    }
  }, [lastBarcode]);

  const { ref } = useZxing({
    onResult: result => { void handleDecode(result.getText()); },
    paused: !!lastBarcode,
  });

  return {
    ref,
    lastBarcode,
    existingRecord,
    wishlistMatch,
    discogsResults,
    isSearching,
    error,
    reset: () => {
      setLastBarcode(null);
      setDiscogsResults([]);
      setError(null);
    },
  };
}
