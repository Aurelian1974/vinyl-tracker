import { useEffect, useRef, useCallback, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { searchDiscogsBarcode, type DiscogsSearchResult } from '@/services/discogs';

// ─── BarcodeDetector API — not yet in standard TypeScript lib ────────────────
interface BarcodeDetectorResult { rawValue: string; format: string }
declare class BarcodeDetector {
  constructor(options?: { formats?: string[] });
  detect(source: HTMLVideoElement | ImageBitmap | ImageData): Promise<BarcodeDetectorResult[]>;
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── Strategie detecție ───────────────────────────────────────────────────────
// 1. Native BarcodeDetector (Chrome Android, Safari iOS 17+) → 0 KB, hardware
// 2. ZBar WASM lazy-loaded (Firefox, iOS <17)                → ~50 KB, 15ms/frame
// Niciodată ZXing — WASM 180 KB, main thread, slab pe EAN-13
// ─────────────────────────────────────────────────────────────────────────────

const SCAN_INTERVAL_MS  = 250;
const SUPPORTED_FORMATS = ['ean_13', 'upc_a', 'ean_8', 'upc_e'];

type ScanEngine = 'detecting' | 'native' | 'zbar' | 'error';

export function useBarcodeScanner() {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const zbarRef     = useRef<typeof import('@undecaf/zbar-wasm') | null>(null);

  const [engine, setEngine]               = useState<ScanEngine>('detecting');
  const [lastBarcode, setLastBarcode]     = useState<string | null>(null);
  const [isSearching, setIsSearching]     = useState(false);
  const [discogsResult, setDiscogsResult] = useState<DiscogsSearchResult | null>(null);
  const [cameraError, setCameraError]     = useState<string | null>(null);

  const existingRecord = useLiveQuery(
    () => lastBarcode ? db.records.where('barcode').equals(lastBarcode).first() : undefined,
    [lastBarcode]
  );

  const wishlistMatch = useLiveQuery(
    () => lastBarcode
      ? db.records.where('barcode').equals(lastBarcode).and(r => r.status === 'wishlist').first()
      : undefined,
    [lastBarcode]
  );

  const handleDetected = useCallback(async (barcode: string) => {
    if (barcode === lastBarcode) return;
    navigator.vibrate?.(80);
    setLastBarcode(barcode);
    setDiscogsResult(null);
    if (existingRecord) return;

    setIsSearching(true);
    try {
      const result = await searchDiscogsBarcode(barcode);
      setDiscogsResult(result ?? null);
    } finally {
      setIsSearching(false);
    }
  }, [lastBarcode, existingRecord]);

  useEffect(() => {
    let active = true;

    async function init() {
      // 1. Pornește camera
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (videoRef.current && active) {
          videoRef.current.srcObject = streamRef.current;
          await videoRef.current.play();
        }
      } catch {
        if (active) setCameraError('Camera indisponibilă — verifică permisiunile');
        return;
      }

      if (!active) return;

      // 2. Alege engine
      if ('BarcodeDetector' in window) {
        detectorRef.current = new BarcodeDetector({ formats: SUPPORTED_FORMATS });
        setEngine('native');
        startNative();
      } else {
        try {
          zbarRef.current = await import('@undecaf/zbar-wasm');
          if (active) { setEngine('zbar'); startZbar(); }
        } catch {
          if (active) setCameraError('Scanner indisponibil pe acest browser');
        }
      }
    }

    function startNative() {
      intervalRef.current = setInterval(async () => {
        const video = videoRef.current;
        if (!video || !detectorRef.current || video.readyState < 2) return;
        try {
          const results = await detectorRef.current.detect(video);
          if (results.length > 0) void handleDetected(results[0].rawValue);
        } catch { /* frame skip */ }
      }, SCAN_INTERVAL_MS);
    }

    function startZbar() {
      const canvas = document.createElement('canvas');
      const ctx    = canvas.getContext('2d', { willReadFrequently: true })!;

      intervalRef.current = setInterval(async () => {
        const video = videoRef.current;
        if (!video || !zbarRef.current || video.readyState < 2) return;
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        try {
          const results = await zbarRef.current.scanImageData(
            ctx.getImageData(0, 0, canvas.width, canvas.height)
          );
          if (results.length > 0) void handleDetected(results[0].decode());
        } catch { /* frame skip */ }
      }, SCAN_INTERVAL_MS);
    }

    void init();

    return () => {
      active = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [handleDetected]);

  return {
    videoRef,
    engine,
    lastBarcode,
    existingRecord,
    wishlistMatch,
    discogsResult,
    isSearching,
    cameraError,
    reset: () => {
      setLastBarcode(null);
      setDiscogsResult(null);
      setIsSearching(false);
    },
  };
}
