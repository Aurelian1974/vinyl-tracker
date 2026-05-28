import { useCoverImage } from '@/hooks/useCoverImage';

interface CoverImageProps {
  recordId?:   number;
  coverUrl?:   string;
  alt:         string;
  size?:       'thumbnail' | 'full';
  className?:  string;
}

export function CoverImage({ recordId, coverUrl, alt, size = 'thumbnail', className = '' }: CoverImageProps) {
  const localUrl = useCoverImage(recordId, size);
  const src = localUrl ?? coverUrl ?? null;

  if (!src) {
    return (
      <div className={`bg-slate-700 flex items-center justify-center ${className}`}>
        <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
          <circle cx="12" cy="12" r="3"  strokeWidth={1.5} />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover ${className}`}
      loading="lazy"
    />
  );
}
