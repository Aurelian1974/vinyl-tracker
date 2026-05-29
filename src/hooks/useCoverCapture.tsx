import { useRef } from 'react';
import { db } from '@/db/db';
import { captureAndCompress } from '@/utils/imageCapture';

export function useCoverCapture(recordId: number) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { thumbnail, full } = await captureAndCompress(file);

    const existing = await db.coverImages.where('recordId').equals(recordId).first();
    const data = {
      recordId,
      photoType: 'cover-front' as const,
      thumbnail,
      full,
      capturedAt: new Date(),
      source: 'camera' as const,
    };

    if (existing?.id) await db.coverImages.update(existing.id, data);
    else              await db.coverImages.add(data);

    e.target.value = '';
  };

  return {
    capture:     () => inputRef.current?.click(),
    CameraInput: () => (
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
    ),
  };
}
