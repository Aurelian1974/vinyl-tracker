import { useStorageQuota } from '@/hooks/useStorageQuota';

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function StorageIndicator() {
  const quota = useStorageQuota();
  if (!quota) return null;

  const color = quota.percentage > 80 ? 'bg-red-500' : quota.percentage > 60 ? 'bg-yellow-500' : 'bg-indigo-500';

  return (
    <div className="text-sm text-slate-400">
      <div className="flex items-center justify-between mb-1">
        <span>Stocare folosită</span>
        <span>{formatBytes(quota.usage)} / {formatBytes(quota.quota)}</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${quota.percentage}%` }}
        />
      </div>
    </div>
  );
}
