import { useState, useRef, useEffect } from 'react';

interface SearchInputProps {
  value:       string;
  onChange:    (value: string) => void;
  placeholder?: string;
  autoFocus?:  boolean;
}

export function SearchInput({ value, onChange, placeholder = 'Caută artist, titlu...', autoFocus = false }: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocal(e.target.value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(e.target.value), 300);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </span>
      <input
        ref={inputRef}
        type="search"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full bg-slate-800 text-white placeholder-slate-400 rounded-xl pl-10 pr-4 py-3 text-base outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-700"
      />
      {local && (
        <button
          onClick={() => { setLocal(''); onChange(''); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
          aria-label="Șterge"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
