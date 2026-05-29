import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { useAppStore } from '@/stores/useAppStore';

export function useSessionBudget() {
  const {
    budgetLimit,
    budgetActive,
    budgetStartedAt,
    setBudgetLimit,
    startSession,
    endSession,
  } = useAppStore();

  const sessionRecords = useLiveQuery<import('@/db/types').VinylRecord[]>(
    () => budgetStartedAt
      ? db.records
          .where('createdAt').above(budgetStartedAt)
          .and(r => r.status === 'owned')
          .toArray()
      : Promise.resolve([]),
    [budgetStartedAt]
  );

  const spent = useMemo(
    () => sessionRecords?.reduce((sum, r) => sum + (r.pricePaid ?? 0), 0) ?? 0,
    [sessionRecords]
  );

  return {
    limit:       budgetLimit,
    spent,
    remaining:   budgetLimit - spent,
    overBudget:  budgetActive && spent > budgetLimit,
    active:      budgetActive,
    startSession,
    endSession,
    setBudgetLimit,
  };
}
