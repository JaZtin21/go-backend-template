// components/SyncButton.tsx
// Drop this anywhere in your UI (a settings page, the shop dashboard header,
// wherever makes sense) — must be somewhere inside <TinyBaseProvider>.
import { useSync } from '~/utils';

export function SyncButton({ isSubscribed }: { isSubscribed: boolean }) {
    const { syncNow, isSyncing, lastSyncedAt, error } = useSync();

    if (!isSubscribed) return null; // nothing to sync against if not subscribed

    return (
        <button onClick={syncNow} disabled={isSyncing}>
            {isSyncing ? 'Syncing…' : 'Sync now'}
            {lastSyncedAt && !isSyncing && !error && (
                <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.7 }}>
                    Last synced {lastSyncedAt.toLocaleTimeString()}
                </span>
            )}
            {error && <span style={{ marginLeft: 8, fontSize: 12, color: 'red' }}>Sync failed — tap to retry</span>}
        </button>
    );
}