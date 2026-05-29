import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Currency } from '@/db/types';

interface AppState {
  lastPurchaseLocation: string;
  defaultCurrency:      Currency;
  setLastLocation:      (loc: string)  => void;
  setDefaultCurrency:   (c: Currency)  => void;
  // Session budget
  budgetLimit:    number;
  budgetActive:   boolean;
  budgetStartedAt: Date | null;
  setBudgetLimit:  (limit: number) => void;
  startSession:    () => void;
  endSession:      () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    set => ({
      lastPurchaseLocation: '',
      defaultCurrency:      'RON',
      setLastLocation:      loc => set({ lastPurchaseLocation: loc }),
      setDefaultCurrency:   c   => set({ defaultCurrency: c }),
      // Session budget
      budgetLimit:    200,
      budgetActive:   false,
      budgetStartedAt: null,
      setBudgetLimit:  limit => set({ budgetLimit: limit }),
      startSession:    ()    => set({ budgetActive: true, budgetStartedAt: new Date() }),
      endSession:      ()    => set({ budgetActive: false, budgetStartedAt: null }),
    }),
    { name: 'vinyl-tracker-ui' }
  )
);
