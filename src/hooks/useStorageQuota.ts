import { useState, useEffect } from 'react';

interface StorageQuota {
  usage:      number;
  quota:      number;
  percentage: number;
}

export function useStorageQuota() {
  const [quota, setQuota] = useState<StorageQuota | null>(null);

  useEffect(() => {
    async function estimate() {
      if (!navigator.storage?.estimate) return;
      const est = await navigator.storage.estimate();
      if (est.usage != null && est.quota != null) {
        setQuota({
          usage:      est.usage,
          quota:      est.quota,
          percentage: Math.round((est.usage / est.quota) * 100),
        });
      }
    }
    void estimate();
  }, []);

  return quota;
}
