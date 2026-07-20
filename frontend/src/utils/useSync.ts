// tinybase/useSync.ts
import { useCallback, useState } from 'react';
import { useStore } from 'tinybase/ui-react';
import type { Store } from 'tinybase';
import { syncAll } from '~/store';

// Manual-only by design: sync runs exclusively when syncNow() is called
// (e.g. from a "Sync now" button), never automatically. This avoids firing
// a batch of network requests the user didn't ask for.
//
// IMPORTANT: this is intentionally NOT gated on `isSubscribed` (that flag
// only controls which source individual query hooks READ from — Apollo vs
// TinyBase). Sync is a separate concern: it should run whenever the user
// presses the button, period, regardless of what the UI happens to be
// displaying at that moment. If there's no network/auth, the underlying
// client.query()/client.mutate() calls in syncEngine.ts will simply reject
// and the catch block below surfaces that as an error state.
export function useSync() {
    const store = useStore() as Store;
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const syncNow = useCallback(async () => {
        setIsSyncing(true);
        setError(null);
        try {
            await syncAll(store);
            setLastSyncedAt(new Date());
        } catch (err) {
            setError(err as Error);
            console.error('Sync failed:', err);
        } finally {
            setIsSyncing(false);
        }
    }, [store]);

    return { syncNow, isSyncing, lastSyncedAt, error };
}