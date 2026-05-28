import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Currency } from '@/db/types';

interface AppState {
  lastPurchaseLocation: string;
  defaultCurrency:      Currency;
  setLastLocation:      (loc: string)  => void;
  setDefaultCurrency:   (c: Currency)  => void;
}

export const useAppStore = create<AppState>()(
  persist(
    set => ({
      lastPurchaseLocation: '',
      defaultCurrency:      'RON',
      setLastLocation:      loc => set({ lastPurchaseLocation: loc }),
      setDefaultCurrency:   c   => set({ defaultCurrency: c }),
    }),
    { name: 'vinyl-tracker-ui' }
  )
);
