import { useRef, useCallback } from 'react';

interface SwipeActions {
  onSwipeLeft?:  () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

/**
 * Returns pointer-event handlers that detect horizontal swipes.
 * Usage: <div {...swipeHandlers()}>
 */
export function useSwipeActions({ onSwipeLeft, onSwipeRight, threshold = 60 }: SwipeActions) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    startX.current = e.clientX;
    startY.current = e.clientY;
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (startX.current === null || startY.current === null) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    // Ignore if vertical movement is dominant
    if (Math.abs(dy) > Math.abs(dx)) { startX.current = null; return; }
    if (dx < -threshold && onSwipeLeft)  onSwipeLeft();
    if (dx >  threshold && onSwipeRight) onSwipeRight();
    startX.current = null;
    startY.current = null;
  }, [onSwipeLeft, onSwipeRight, threshold]);

  const onPointerLeave = useCallback(() => {
    startX.current = null;
    startY.current = null;
  }, []);

  return { onPointerDown, onPointerUp, onPointerLeave };
}
