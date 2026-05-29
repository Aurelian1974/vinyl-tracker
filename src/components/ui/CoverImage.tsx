import { useCoverImage }       from '@/hooks/useCoverImage';
import { useCoverCacheStatus } from '@/hooks/useDiscogCovers';

interface CoverImageProps {
  recordId?:   number;
  coverUrl?:   string;
  alt:         string;
  size?:       'thumbnail' | 'full';
  className?:  string;
}

export function CoverImage({ recordId, coverUrl, alt, size = 'thumbnail', className = '' }: CoverImageProps) {
  const localUrl  = useCoverImage(recordId, size);
  const isCached  = useCoverCacheStatus(coverUrl);
  const src = localUrl ?? coverUrl ?? null;

  if (!src) {
    return (
      <div className={`relative bg-slate-700 flex items-center justify-center ${className}`}>
        <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
          <circle cx="12" cy="12" r="3"  strokeWidth={1.5} />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      {/* Badge mic — copertă Discogs cached offline */}
      {!localUrl && coverUrl && isCached && (
        <span className="absolute bottom-0.5 right-0.5 text-[8px] text-white/40 leading-none">
          ✓
        </span>
      )}
    </div>
  );
}
