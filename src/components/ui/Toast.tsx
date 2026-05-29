interface ToastProps {
  message: string;
  visible: boolean;
}

export function Toast({ message, visible }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 bg-slate-700 text-white text-sm font-medium rounded-2xl shadow-xl border border-slate-600 whitespace-nowrap transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}
    >
      {message}
    </div>
  );
}
