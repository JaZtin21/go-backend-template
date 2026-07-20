// shopHooks.ts (TinyBase — complete, all queries + mutations)
//
// isSubscribed picks Apollo (cloud) vs TinyBase (local) for QUERIES.
// When isSubscribed is true, list/single-record queries now MERGE the
// server response with any locally _dirty rows (created/edited/deleted
// offline but not yet pushed) — see mergeRowsWithLocalDirty. Without this,
// switching isSubscribed from false->true would make unsynced local data
// disappear from the UI until the next manual sync, even though it's still
// sitting right there in TinyBase.
//
// For MUTATIONS, isSubscribed means "dual-write": when true, we hit the
// backend AND mirror the server's authoritative response into TinyBase
// (marked _serverSynced: true, _dirty: false) so offline reads/metrics/sales
// history work immediately without requiring a manual sync. When false, we
// write to TinyBase only, marked _dirty: true so syncEngine.ts picks it up
// on the next manual "Sync now".

import { useQuery, useLazyQuery, useMutation } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';
import { useStore, useTable, useRow } from 'tinybase/ui-react';
import type { Store } from 'tinybase';
import type { Shop } from '~/types'; // adjust path to your actual types file
import type { Item, CartItem } from '~/types';
import type { ShopDashboardMetrics, DailySalesMetric } from '~/types/shop';

import {
    SEARCH_SHOP_PRODUCTS_QUERY,
    GET_MY_SHOPS_QUERY,
    GET_SHOP_INVENTORY_QUERY,
    GET_CHECKOUT_HISTORY_QUERY,
    GET_ITEM_ACTION_HISTORY_QUERY,
    GET_SHOP_BY_ID_QUERY,
    GET_SHOP_DASHBOARD_METRICS_QUERY,
    DELETE_SHOP_MUTATION,
    CHECKOUT_CART_MUTATION,
    ADD_INVENTORY_ITEM_MUTATION,
    UPDATE_INVENTORY_ITEM_MUTATION,
    INCREMENT_STOCK_MUTATION,
    CREATE_SHOP_MUTATION,
    UPDATE_SHOP_MUTATION,
    DELETE_INVENTORY_ITEM_MUTATION,
} from '../graphql';
import { fileToStorableBase64 } from '~/utils';

// =========================================================================
// ROW <-> DOMAIN MAPPERS
// =========================================================================

function toShopRow(shop: Partial<Shop>) {
    return {
        shopName: shop.shopName ?? '',
        description: shop.description ?? '',
        address: shop.address ?? '',
        coordinatesJson: JSON.stringify(shop.coordinates ?? { lat: 0, lng: 0 }),
        photo: typeof shop.photo === 'string' ? shop.photo : '', // File objects can't persist offline
        photosJson: JSON.stringify(shop.photos ?? []),
        businessHoursJson: JSON.stringify(shop.businessHours ?? { openTime: '', closeTime: '', days: [] }),
        businessType: shop.businessType ?? '',
        paymentMethodsJson: JSON.stringify(shop.paymentMethods ?? { cash: false, gcash: false, paymaya: false, card: false }),
        deliveryJson: JSON.stringify(shop.delivery ?? { available: false }),
        socialMediaJson: JSON.stringify(shop.socialMedia ?? {}),
        verificationJson: JSON.stringify(shop.verification ?? { isVerified: false }),
        contactDetailsJson: JSON.stringify(shop.contactDetails ?? { phone: '', email: '', address: '' }),
        rating: shop.rating ?? 0,
        createdAt: shop.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: shop.createdBy ?? '',
        status: shop.status ?? 'ACTIVE',
    };
}

function fromShopRow(id: string, row: any): Shop {
    return {
        id,
        shopName: row.shopName,
        description: row.description,
        address: row.address,
        coordinates: JSON.parse(row.coordinatesJson || '{"lat":0,"lng":0}'),
        photo: row.photo,
        photos: JSON.parse(row.photosJson || '[]'),
        businessHours: JSON.parse(row.businessHoursJson || '{"openTime":"","closeTime":"","days":[]}'),
        businessType: row.businessType || undefined,
        paymentMethods: JSON.parse(row.paymentMethodsJson || '{"cash":false,"gcash":false,"paymaya":false,"card":false}'),
        delivery: JSON.parse(row.deliveryJson || '{"available":false}'),
        socialMedia: JSON.parse(row.socialMediaJson || '{}'),
        verification: JSON.parse(row.verificationJson || '{"isVerified":false}'),
        contactDetails: JSON.parse(row.contactDetailsJson || '{"phone":"","email":"","address":""}'),
        rating: row.rating,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        createdBy: row.createdBy,
        status: row.status as Shop['status'],
    };
}

function toItemRow(item: Partial<Item>) {
    return {
        shopId: item.shopId ?? '',
        itemName: item.itemName ?? '',
        description: item.description ?? '',
        barcode: item.barcode ?? '',
        category: item.category ?? '',
        unitOfMeasure: item.unitOfMeasure ?? '',
        photo: item.photo ?? '',
        sellingPrice: item.sellingPrice ?? 0,
        stockQuantity: item.stockQuantity ?? 0,
        costPrice: item.costPrice ?? 0,
        reorderLevel: item.reorderLevel ?? 0,
        updatedAt: new Date().toISOString(),
    };
}

function fromItemRow(id: string, row: any): Item {
    return {
        id,
        shopId: row.shopId,
        itemName: row.itemName,
        description: row.description,
        barcode: row.barcode,
        category: row.category,
        unitOfMeasure: row.unitOfMeasure,
        photo: row.photo,
        sellingPrice: row.sellingPrice,
        stockQuantity: row.stockQuantity,
        costPrice: row.costPrice,
        reorderLevel: row.reorderLevel,
        updatedAt: row.updatedAt,
    };
}

function fromCheckoutRow(id: string, row: any) {
    return {
        id,
        shopId: row.shopId,
        soldAt: row.soldAt,
        totalItems: row.totalItems,
        totalCost: row.totalCost,
        grossSale: row.grossSale,
        grossProfit: row.grossProfit,
        items: JSON.parse(row.itemsJson || '[]'),
    };
}

// =========================================================================
// MERGE HELPER — for isSubscribed:true reads. Server data is the base, but
// any row that's locally _dirty (created/edited/deleted offline, not yet
// pushed) takes priority over the server's version, since it represents a
// change the user made that just hasn't reached the backend yet. Without
// this, toggling isSubscribed true would make unsynced local rows silently
// disappear (or show stale server values) until the next manual sync.
// =========================================================================

function mergeRowsWithLocalDirty<T extends { id: string }>(
    serverRows: T[],
    localTable: Record<string, any>,
    fromRow: (id: string, row: any) => T
): T[] {
    const serverIds = new Set(serverRows.map((r) => r.id));
    const result: T[] = [];

    // Base: server rows, with local dirty edits substituted in, and
    // pending-deletes filtered out.
    for (const serverRow of serverRows) {
        const localRow = localTable[serverRow.id];
        if (localRow?._dirty) {
            if (localRow._deleted) continue; // deletion pending — hide it
            result.push(fromRow(serverRow.id, localRow)); // show the unsynced edit, not stale server data
        } else {
            result.push(serverRow);
        }
    }

    // Local-only rows: created offline, never reached the server yet, so
    // they have no id in serverRows at all.
    for (const [id, row] of Object.entries(localTable)) {
        if (row._dirty && !row._deleted && !serverIds.has(id)) {
            result.push(fromRow(id, row));
        }
    }

    return result;
}

// =========================================================================
// QUERIES
// =========================================================================

// ---- 1. useMyShops (GET_MY_SHOPS_QUERY) ----
export function useMyShops(opts: { limit: number; offset: number; isSubscribed: boolean }) {
    const { limit, offset, isSubscribed } = opts;
    const store = useStore() as Store;
    const shopsTable = useTable('shops', store);

    const apolloResult = useQuery(GET_MY_SHOPS_QUERY, {
        variables: { limit, offset },
        fetchPolicy: 'cache-and-network',
        skip: !isSubscribed,
    }) as { loading: boolean; error: any; data: any | undefined };

    const offlineResult = useMemo(() => {
        const allShops = Object.entries(shopsTable)
            .filter(([, row]: any) => !row._deleted)
            .map(([id, row]) => fromShopRow(id, row))
            // Sort to match the backend's ORDER BY created_at DESC — otherwise
            // shops created locally land at the end of JS object insertion
            // order instead of respecting recency like the server does.
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const page = allShops.slice(offset, offset + limit);
        return {
            loading: false,
            error: null,
            data: {
                getMyShops: {
                    shops: page,
                    totalCount: allShops.length,
                    hasNextPage: offset + limit < allShops.length,
                },
            },
        };
    }, [shopsTable, offset, limit]);

    // Merge server data with any locally-dirty shops (unsynced creates/edits/
    // deletes) so nothing appears/disappears purely based on isSubscribed.
    // NOTE: merges within the current server-fetched PAGE only. A local-only
    // unsynced shop is appended even if it would technically belong on a
    // different page under a true global re-sort — fine for a handful of
    // pending items, but be aware it's a page-local merge.
    const mergedApolloResult = useMemo(() => {
        if (!apolloResult.data?.getMyShops) return apolloResult;

        const merged = mergeRowsWithLocalDirty(
            apolloResult.data.getMyShops.shops,
            shopsTable,
            fromShopRow
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return {
            ...apolloResult,
            data: {
                getMyShops: {
                    ...apolloResult.data.getMyShops,
                    shops: merged,
                    totalCount:
                        apolloResult.data.getMyShops.totalCount +
                        Math.max(0, merged.length - apolloResult.data.getMyShops.shops.length),
                },
            },
        };
    }, [apolloResult, shopsTable]);

    return isSubscribed ? mergedApolloResult : offlineResult;
}

// ---- 2. useShopInventory (GET_SHOP_INVENTORY_QUERY) ----
export function useShopInventory(opts: {
    shopId: string;
    itemsPerPage: number;
    offset: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    isSubscribed: boolean;
}) {
    const { shopId, itemsPerPage, offset, search, sortBy, sortOrder, isSubscribed } = opts;
    const store = useStore() as Store;
    const inventoryTable = useTable('inventory', store);

    const apolloResult = useQuery(GET_SHOP_INVENTORY_QUERY, {
        variables: {
            shopId,
            limit: itemsPerPage,
            offset,
            search: search || undefined,
            sortBy: sortBy || undefined,
            sortOrder: sortOrder || undefined,
        },
        fetchPolicy: 'no-cache',
        skip: !isSubscribed || !shopId,
    }) as { loading: boolean; error: any; data: { getShopInventory: { items: Item[]; totalCount: number } } };

    const offlineResult = useMemo(() => {
        let items = Object.entries(inventoryTable)
            .filter(([, row]: any) => !row._deleted)
            .map(([id, row]) => fromItemRow(id, row))
            .filter((i) => i.shopId === shopId);

        if (search) {
            const re = new RegExp(search, 'i');
            items = items.filter((i) => re.test(i.itemName));
        }
        if (sortBy) {
            items = [...items].sort((a: any, b: any) => {
                const dir = sortOrder === 'desc' ? -1 : 1;
                return a[sortBy] > b[sortBy] ? dir : a[sortBy] < b[sortBy] ? -dir : 0;
            });
        }
        const page = items.slice(offset, offset + itemsPerPage);

        return {
            loading: false,
            error: null,
            data: { getShopInventory: { items: page, totalCount: items.length } },
        };
    }, [inventoryTable, shopId, search, sortBy, sortOrder, offset, itemsPerPage]);

    const mergedApolloResult = useMemo(() => {
        if (!apolloResult.data?.getShopInventory) return apolloResult;

        // only merge in local dirty rows for THIS shop
        const scopedInventory = Object.fromEntries(
            Object.entries(inventoryTable).filter(([, row]: any) => row.shopId === shopId)
        );

        let merged = mergeRowsWithLocalDirty(
            apolloResult.data.getShopInventory.items,
            scopedInventory,
            fromItemRow
        );

        if (search) {
            const re = new RegExp(search, 'i');
            merged = merged.filter((i) => re.test(i.itemName));
        }

        return {
            ...apolloResult,
            data: {
                getShopInventory: {
                    ...apolloResult.data.getShopInventory,
                    items: merged,
                    totalCount:
                        apolloResult.data.getShopInventory.totalCount +
                        Math.max(0, merged.length - apolloResult.data.getShopInventory.items.length),
                },
            },
        };
    }, [apolloResult, inventoryTable, shopId, search]);

    return isSubscribed ? mergedApolloResult : offlineResult;
}

// ---- 3. useSearchShopProducts (SEARCH_SHOP_PRODUCTS_QUERY, was useLazyQuery) ----
export function useSearchShopProducts(isSubscribed: boolean) {
    const store = useStore() as Store;

    const [apolloSearch, apolloResult] = useLazyQuery(SEARCH_SHOP_PRODUCTS_QUERY, {
        fetchPolicy: 'network-only',
    });

    const search = useCallback(
        (options: { variables: { shopId: string; query: string } }) => {
            if (isSubscribed) return apolloSearch(options);

            const { shopId, query } = options.variables;
            const re = new RegExp(query, 'i');
            const inventoryTable = store.getTable('inventory');
            const results = Object.entries(inventoryTable)
                .map(([id, row]) => fromItemRow(id, row))
                .filter((i) => i.shopId === shopId && re.test(i.itemName));

            return Promise.resolve({ data: { searchShopProducts: results } });
        },
        [isSubscribed, store]
    );

    return isSubscribed ? ([apolloSearch, apolloResult] as const) : ([search, { loading: false, error: null }] as const);
}

// ---- 4. useCheckoutHistory (GET_CHECKOUT_HISTORY_QUERY) ----
export function useCheckoutHistory(opts: {
    shopId: string;
    offset: number;
    pageLimit: number;
    activeTab: string;
    isSubscribed: boolean;
}) {
    const { shopId, offset, pageLimit, activeTab, isSubscribed } = opts;
    const store = useStore() as Store;
    const checkoutTable = useTable('checkoutHistory', store);

    const apolloResult = useQuery(GET_CHECKOUT_HISTORY_QUERY, {
        variables: { shopId, limit: pageLimit, offset },
        skip: !isSubscribed || !shopId || activeTab !== 'checkout',
        fetchPolicy: 'no-cache',
    }) as { loading: boolean; error: any; data?: any };

    const offlineResult = useMemo(() => {
        if (activeTab !== 'checkout') return { loading: false, error: null, data: undefined };

        const batches = Object.entries(checkoutTable)
            .filter(([, row]: any) => row.shopId === shopId && !row._deleted)
            .map(([id, row]) => fromCheckoutRow(id, row))
            .sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime()); // matches ORDER BY sold_at DESC

        const page = batches.slice(offset, offset + pageLimit);

        return {
            loading: false,
            error: null,
            data: {
                getCheckoutHistory: {
                    batches: page,
                    totalCount: batches.length,
                    hasNextPage: offset + pageLimit < batches.length,
                },
            },
        };
    }, [checkoutTable, shopId, activeTab, offset, pageLimit]);

    // Merge in any locally-created-but-unsynced checkout batches so a sale
    // made offline shows up immediately once isSubscribed flips true, instead
    // of waiting for a manual sync.
    const mergedApolloResult = useMemo(() => {
        if (activeTab !== 'checkout' || !apolloResult.data?.getCheckoutHistory) return apolloResult;

        const scopedCheckouts = Object.fromEntries(
            Object.entries(checkoutTable).filter(([, row]: any) => row.shopId === shopId)
        );

        const merged = mergeRowsWithLocalDirty(
            apolloResult.data.getCheckoutHistory.batches,
            scopedCheckouts,
            fromCheckoutRow
        ).sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime());

        return {
            ...apolloResult,
            data: {
                getCheckoutHistory: {
                    ...apolloResult.data.getCheckoutHistory,
                    batches: merged,
                    totalCount:
                        apolloResult.data.getCheckoutHistory.totalCount +
                        Math.max(0, merged.length - apolloResult.data.getCheckoutHistory.batches.length),
                },
            },
        };
    }, [apolloResult, checkoutTable, shopId, activeTab]);

    return isSubscribed ? mergedApolloResult : offlineResult;
}

// ---- 5. useItemActionHistory (GET_ITEM_ACTION_HISTORY_QUERY) ----
// NOTE: no merge logic here on purpose. This table is pull-only — your
// backend writes these rows itself as a side effect of other mutations
// (AddInventoryItem/UpdateInventoryItem/DeleteInventoryItem/IncrementStock).
// There's no client mutation that creates a local-only, unsynced action
// record, so there's nothing for isSubscribed:true to be missing here.
export function useItemActionHistory(opts: {
    shopId: string;
    offset: number;
    pageLimit: number;
    activeTab: string;
    isSubscribed: boolean;
}) {
    const { shopId, offset, pageLimit, activeTab, isSubscribed } = opts;
    const store = useStore() as Store;
    const actionsTable = useTable('itemActionHistory', store);

    const apolloResult = useQuery(GET_ITEM_ACTION_HISTORY_QUERY, {
        variables: { shopId, limit: pageLimit, offset },
        skip: !isSubscribed || !shopId || activeTab !== 'actions',
        fetchPolicy: 'no-cache',
    }) as { loading: boolean; error: any; data?: any };

    const offlineResult = useMemo(() => {
        if (activeTab !== 'actions') return { loading: false, error: null, data: undefined };

        const records = Object.entries(actionsTable)
            .filter(([, row]: any) => row.shopId === shopId)
            .map(([id, row]: any) => ({
                id,
                shopId: row.shopId,
                inventoryItemId: row.inventoryItemId,
                itemName: row.itemName,
                action: row.action,
                quantity: row.quantity,
                date: row.date,
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // matches ORDER BY created_at DESC

        const page = records.slice(offset, offset + pageLimit);

        return {
            loading: false,
            error: null,
            data: {
                getItemActionHistory: {
                    records: page,
                    totalCount: records.length,
                    hasNextPage: offset + pageLimit < records.length,
                },
            },
        };
    }, [actionsTable, shopId, activeTab, offset, pageLimit]);

    return isSubscribed ? apolloResult : offlineResult;
}

// ---- 6. useShopById (GET_SHOP_BY_ID_QUERY) ----
export function useShopById(shopId: string, shop: Shop | undefined, isSubscribed: boolean) {
    const store = useStore() as Store;
    const row = useRow('shops', shopId, store);

    const apolloResult = useQuery(GET_SHOP_BY_ID_QUERY, {
        variables: { shopId },
        skip: !isSubscribed || !shopId || !!shop,
        fetchPolicy: 'no-cache',
    }) as { loading: boolean; error: any; data: { getShopById: Shop } | undefined };

    const offlineResult = useMemo(() => {
        const hasRow = row && Object.keys(row).length > 0;
        return {
            loading: false,
            error: null,
            data: hasRow ? { getShopById: fromShopRow(shopId, row) } : undefined,
        };
    }, [row, shopId]);

    // If there's a local unsynced edit for this specific shop, prefer it over
    // the (now-stale) server response, same rule as the list-based hooks.
    const mergedApolloResult = useMemo(() => {
        if (!apolloResult.data?.getShopById) return apolloResult;
        const hasLocalDirtyRow = row && Object.keys(row).length > 0 && (row as any)._dirty && !(row as any)._deleted;
        if (!hasLocalDirtyRow) return apolloResult;
        return { ...apolloResult, data: { getShopById: fromShopRow(shopId, row) } };
    }, [apolloResult, row, shopId]);

    return isSubscribed ? mergedApolloResult : offlineResult;
}

// ---- 7. useShopDashboardMetrics (GET_SHOP_DASHBOARD_METRICS_QUERY) ----
// Computed locally from inventory + checkoutHistory to MATCH your Go
// resolver's SQL as closely as JS date math allows:
//   - todaysGrossSales / todaysSalesGrowthPct: today vs the exact same
//     calendar day 7 days ago (a 1-day window each), per your salesQuery.
//   - weeklyRevenueGrowthIndex: trailing 7 days vs the 7 days before that,
//     per your weeklyQuery. 100 when there's no prior-period baseline.
//   - averageTicketSize: AVG(gross_sale) across ALL checkout batches ever
//     for this shop — NOT just today's — matching your aovQuery exactly.
//     (Previously this was wrongly computed as today's total / today's
//     count, which is why it read wrong offline.)
//   - inventoryCapitalRatio: sum(cost*qty) / sum(price*qty) * 100.
//   - weeklySalesTrend: last 7 calendar days, oldest -> newest, matching
//     your RECURSIVE calendar series query.
export function useShopDashboardMetrics(shopId: string, isSubscribed: boolean) {
    const store = useStore() as Store;
    const inventoryTable = useTable('inventory', store);
    const checkoutTable = useTable('checkoutHistory', store);

    const apolloResult = useQuery(GET_SHOP_DASHBOARD_METRICS_QUERY, {
        variables: { shopId },
        skip: !isSubscribed || !shopId,
    }) as { data: { getShopDashboardMetrics: ShopDashboardMetrics }; loading: boolean; error: any };

    const offlineResult = useMemo(() => {
        const items = Object.values(inventoryTable).filter((r: any) => r.shopId === shopId && !r._deleted) as any[];
        const checkouts = Object.values(checkoutTable).filter((r: any) => r.shopId === shopId && !r._deleted) as any[];

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // --- Today's gross sales & growth vs the same calendar day last week ---
        const todaysCheckouts = checkouts.filter((c) => new Date(c.soldAt) >= startOfToday);
        const todaysGrossSales = todaysCheckouts.reduce((sum, c) => sum + (c.grossSale || 0), 0);

        const sevenDaysAgoStart = new Date(startOfToday);
        sevenDaysAgoStart.setDate(sevenDaysAgoStart.getDate() - 7);
        const sixDaysAgoStart = new Date(startOfToday);
        sixDaysAgoStart.setDate(sixDaysAgoStart.getDate() - 6);

        const sameDayLastWeekSales = checkouts
            .filter((c) => {
                const d = new Date(c.soldAt);
                return d >= sevenDaysAgoStart && d < sixDaysAgoStart;
            })
            .reduce((sum, c) => sum + (c.grossSale || 0), 0);

        const todaysSalesGrowthPct =
            sameDayLastWeekSales === 0 ? 0 : ((todaysGrossSales - sameDayLastWeekSales) / sameDayLastWeekSales) * 100;

        // --- Weekly revenue growth index: trailing 7 days vs the 7 before that ---
        const currentWeekStart = new Date(now);
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        const previousWeekStart = new Date(now);
        previousWeekStart.setDate(previousWeekStart.getDate() - 14);

        const current7DaysTotal = checkouts
            .filter((c) => new Date(c.soldAt) >= currentWeekStart)
            .reduce((sum, c) => sum + (c.grossSale || 0), 0);
        const previous7DaysTotal = checkouts
            .filter((c) => {
                const d = new Date(c.soldAt);
                return d >= previousWeekStart && d < currentWeekStart;
            })
            .reduce((sum, c) => sum + (c.grossSale || 0), 0);

        const weeklyRevenueGrowthIndex = previous7DaysTotal === 0 ? 100 : (current7DaysTotal / previous7DaysTotal) * 100;

        // --- Average ticket size: all-time average, matches AVG(gross_sale) ---
        const averageTicketSize = checkouts.length
            ? checkouts.reduce((sum, c) => sum + (c.grossSale || 0), 0) / checkouts.length
            : 0;

        // --- Inventory capital ratio ---
        const inventoryValue = items.reduce((sum, i) => sum + (i.costPrice || 0) * (i.stockQuantity || 0), 0);
        const inventoryRetailValue = items.reduce((sum, i) => sum + (i.sellingPrice || 0) * (i.stockQuantity || 0), 0);
        const inventoryCapitalRatio = inventoryRetailValue > 0 ? (inventoryValue / inventoryRetailValue) * 100 : 0;

        // --- 7-day sales trend, oldest -> newest ---
        const weeklySalesTrend: DailySalesMetric[] = [];
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(startOfToday);
            dayStart.setDate(dayStart.getDate() - i);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);

            const dayCheckouts = checkouts.filter((c) => {
                const d = new Date(c.soldAt);
                return d >= dayStart && d < dayEnd;
            });

            weeklySalesTrend.push({
                dayName: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
                formattedDate: `${String(dayStart.getMonth() + 1).padStart(2, '0')}/${String(dayStart.getDate()).padStart(2, '0')}`,
                grossSale: dayCheckouts.reduce((sum, c) => sum + (c.grossSale || 0), 0),
                grossProfit: dayCheckouts.reduce((sum, c) => sum + (c.grossProfit || 0), 0),
            });
        }

        const metrics: ShopDashboardMetrics = {
            todaysGrossSales,
            todaysSalesGrowthPct,
            weeklyRevenueGrowthIndex,
            averageTicketSize,
            inventoryCapitalRatio,
            weeklySalesTrend,
        };

        return { loading: false, error: null, data: { getShopDashboardMetrics: metrics } };
    }, [inventoryTable, checkoutTable, shopId]);

    // Not merged with apolloResult on the isSubscribed:true path — this is
    // an aggregate computed server-side via SQL, not a list of rows we can
    // splice a local-only entry into. An offline sale won't be reflected in
    // the ONLINE metrics view until it's actually pushed via "Sync now".
    // If you need that too, it'd mean recomputing deltas client-side on top
    // of the server's numbers — happy to build that if you want it, but
    // flagging it's a materially different (and more involved) piece of work.
    return isSubscribed ? apolloResult : offlineResult;
}

// =========================================================================
// MUTATIONS — dual-write when isSubscribed
// =========================================================================

type MutationCallbacks = {
    isSubscribed: boolean;
    onCompleted?: (data?: any) => void;
    onError?: (error: any) => void;
    refetchQueries?: any;
    awaitRefetchQueries?: boolean;
};

// ---- useDeleteShop ----
export function useDeleteShop(opts: MutationCallbacks) {
    const store = useStore() as Store;
    const [mutate, { loading }] = useMutation(DELETE_SHOP_MUTATION, {
        refetchQueries: opts.isSubscribed ? opts.refetchQueries : undefined,
        onError: opts.onError,
    });

    const deleteShop = useCallback(
        async (options: { variables: { shopId: string } }) => {
            const { shopId } = options.variables;
            try {
                if (opts.isSubscribed) {
                    await mutate(options);
                    store.delRow('shops', shopId);
                } else {
                    const existing = store.getRow('shops', shopId);
                    if (existing && Object.keys(existing).length > 0 && existing._serverSynced) {
                        store.setPartialRow('shops', shopId, { _deleted: true, _dirty: true });
                    } else {
                        store.delRow('shops', shopId);
                    }
                }
                opts.onCompleted?.();
            } catch (err) {
                opts.onError?.(err);
            }
        },
        [opts.isSubscribed, store]
    );

    return [deleteShop, { loading: opts.isSubscribed ? loading : false }] as const;
}

// ---- useCreateShop ----
export function useCreateShop(opts: MutationCallbacks) {
    const store = useStore() as Store;
    const [mutate, { loading }] = useMutation(CREATE_SHOP_MUTATION, { onError: opts.onError });

    const createShop = useCallback(
        async (options: { variables: { input: Partial<Shop> } }) => {
            try {
                if (opts.isSubscribed) {
                    const { data } = await mutate(options);
                    const serverShop = data?.createShop;
                    if (serverShop) {
                        const row = { ...toShopRow(serverShop), _dirty: false, _serverSynced: true, _deleted: false };
                        store.setRow('shops', serverShop.id, row);
                    }
                    opts.onCompleted?.(data);
                } else {
                    const id = crypto.randomUUID();
                    const input = { ...options.variables.input };
                    if (input.photo instanceof File) {
                        input.photo = await fileToStorableBase64(input.photo);
                    }
                    const row = { ...toShopRow(input), _dirty: true, _serverSynced: false, _deleted: false };
                    store.setRow('shops', id, row);
                    opts.onCompleted?.({ createShop: fromShopRow(id, row) });
                }
            } catch (err) {
                opts.onError?.(err);
            }
        },
        [opts.isSubscribed, store]
    );

    return [createShop, { loading: opts.isSubscribed ? loading : false }] as const;
}

// ---- useUpdateShop ----
export function useUpdateShop(opts: MutationCallbacks) {
    const store = useStore() as Store;
    const [mutate, { loading }] = useMutation(UPDATE_SHOP_MUTATION, { onError: opts.onError });

    const updateShop = useCallback(
        async (options: { variables: { shopId: string; input: Partial<Shop> } }) => {
            try {
                if (opts.isSubscribed) {
                    const { data } = await mutate(options);
                    const serverShop = data?.updateShop;
                    if (serverShop) {
                        const row = { ...toShopRow(serverShop), _dirty: false, _serverSynced: true, _deleted: false };
                        store.setRow('shops', options.variables.shopId, row);
                    }
                    opts.onCompleted?.(data);
                } else {
                    const input = { ...options.variables.input };
                    if (input.photo instanceof File) {
                        input.photo = await fileToStorableBase64(input.photo);
                    }
                    const existing = store.getRow('shops', options.variables.shopId);
                    const merged = { ...existing, ...toShopRow(input), _dirty: true };
                    store.setRow('shops', options.variables.shopId, merged);
                    opts.onCompleted?.({ updateShop: fromShopRow(options.variables.shopId, merged) });
                }
            } catch (err) {
                opts.onError?.(err);
            }
        },
        [opts.isSubscribed, store]
    );

    return [updateShop, { loading: opts.isSubscribed ? loading : false }] as const;
}

// ---- useAddInventoryItem ----
export function useAddInventoryItem(opts: MutationCallbacks) {
    const store = useStore() as Store;
    const [mutate, { loading }] = useMutation(ADD_INVENTORY_ITEM_MUTATION, {
        refetchQueries: opts.isSubscribed ? ['GetShopInventory'] : undefined,
        onError: opts.onError,
    });

    const addInventoryItem = useCallback(
        async (options: { variables: { input: Partial<Item> } }) => {
            try {
                if (opts.isSubscribed) {
                    const { data } = await mutate(options);
                    const serverItem = data?.addInventoryItem;
                    if (serverItem) {
                        const row = { ...toItemRow(serverItem), _dirty: false, _serverSynced: true, _deleted: false };
                        store.setRow('inventory', serverItem.id, row);
                    }
                    opts.onCompleted?.(data);
                } else {
                    const id = crypto.randomUUID();
                    const row = { ...toItemRow(options.variables.input), _dirty: true, _serverSynced: false, _deleted: false };
                    store.setRow('inventory', id, row);
                    opts.onCompleted?.({ addInventoryItem: fromItemRow(id, row) });
                }
            } catch (err) {
                opts.onError?.(err);
            }
        },
        [opts.isSubscribed, store]
    );

    return [addInventoryItem, { loading: opts.isSubscribed ? loading : false }] as const;
}

// ---- useUpdateInventoryItem ----
export function useUpdateInventoryItem(opts: MutationCallbacks) {
    const store = useStore() as Store;
    const [mutate, { loading }] = useMutation(UPDATE_INVENTORY_ITEM_MUTATION, {
        refetchQueries: opts.isSubscribed ? ['GetShopInventory'] : undefined,
        onError: opts.onError,
    });

    const updateInventoryItem = useCallback(
        async (options: { variables: { itemId: string; input: Partial<Item> } }) => {
            try {
                if (opts.isSubscribed) {
                    const { data } = await mutate(options);
                    const serverItem = data?.updateInventoryItem;
                    if (serverItem) {
                        const row = { ...toItemRow(serverItem), _dirty: false, _serverSynced: true, _deleted: false };
                        store.setRow('inventory', options.variables.itemId, row);
                    }
                    opts.onCompleted?.(data);
                } else {
                    const existing = store.getRow('inventory', options.variables.itemId);
                    if (!existing || Object.keys(existing).length === 0) throw new Error('Item not found locally');
                    const merged = { ...existing, ...toItemRow(options.variables.input), _dirty: true };
                    store.setRow('inventory', options.variables.itemId, merged);
                    opts.onCompleted?.({ updateInventoryItem: fromItemRow(options.variables.itemId, merged) });
                }
            } catch (err) {
                opts.onError?.(err);
            }
        },
        [opts.isSubscribed, store]
    );

    return [updateInventoryItem, { loading: opts.isSubscribed ? loading : false }] as const;
}

// ---- useIncrementStock ----
export function useIncrementStock(opts: MutationCallbacks) {
    const store = useStore() as Store;
    const [mutate, { loading }] = useMutation(INCREMENT_STOCK_MUTATION, {
        awaitRefetchQueries: opts.isSubscribed,
        onError: opts.onError,
    });

    const incrementStock = useCallback(
        async (options: { variables: { itemId: string; amount: number } }) => {
            try {
                if (opts.isSubscribed) {
                    const { data } = await mutate(options);
                    const serverItem = data?.incrementStock;
                    if (serverItem) {
                        const row = { ...toItemRow(serverItem), _dirty: false, _serverSynced: true, _deleted: false };
                        store.setRow('inventory', options.variables.itemId, row);
                    }
                    opts.onCompleted?.(data);
                } else {
                    const existing = store.getRow('inventory', options.variables.itemId);
                    if (!existing || Object.keys(existing).length === 0) throw new Error('Item not found locally');
                    const newStock = (existing.stockQuantity as number || 0) + options.variables.amount;
                    store.setCell('inventory', options.variables.itemId, 'stockQuantity', newStock);
                    store.setCell('inventory', options.variables.itemId, 'updatedAt', new Date().toISOString());
                    store.setCell('inventory', options.variables.itemId, '_dirty', true);
                    const updated = store.getRow('inventory', options.variables.itemId);
                    opts.onCompleted?.({ incrementStock: fromItemRow(options.variables.itemId, updated) });
                }
            } catch (err) {
                opts.onError?.(err);
            }
        },
        [opts.isSubscribed, store]
    );

    return [incrementStock, { loading: opts.isSubscribed ? loading : false }] as const;
}

// ---- useDeleteInventoryItem ----
export function useDeleteInventoryItem(opts: MutationCallbacks) {
    const store = useStore() as Store;
    const [mutate, { loading }] = useMutation(DELETE_INVENTORY_ITEM_MUTATION, {
        refetchQueries: opts.isSubscribed ? ['GetShopInventory'] : undefined,
        onError: opts.onError,
    });

    const deleteInventoryItem = useCallback(
        async (options: { variables: { itemId: string } }) => {
            try {
                if (opts.isSubscribed) {
                    await mutate(options);
                    store.delRow('inventory', options.variables.itemId);
                } else {
                    const existing = store.getRow('inventory', options.variables.itemId);
                    if (existing && Object.keys(existing).length > 0 && existing._serverSynced) {
                        store.setPartialRow('inventory', options.variables.itemId, { _deleted: true, _dirty: true });
                    } else {
                        store.delRow('inventory', options.variables.itemId);
                    }
                }
                opts.onCompleted?.();
            } catch (err) {
                opts.onError?.(err);
            }
        },
        [opts.isSubscribed, store]
    );

    return [deleteInventoryItem, { loading: opts.isSubscribed ? loading : false }] as const;
}

// ---- useCheckoutCart ----
export function useCheckoutCart(opts: MutationCallbacks & { shopId: string }) {
    const store = useStore() as Store;
    const [mutate, { loading }] = useMutation(CHECKOUT_CART_MUTATION, {
        refetchQueries: opts.isSubscribed
            ? [{ query: GET_SHOP_DASHBOARD_METRICS_QUERY, variables: { shopId: opts.shopId } }]
            : undefined,
        awaitRefetchQueries: opts.isSubscribed,
        onError: opts.onError,
    });

    const checkoutCart = useCallback(
        async (options: { variables: { items: CartItem[] } }) => {
            try {
                if (opts.isSubscribed) {
                    const { data } = await mutate({
                        variables: {
                            input: {
                                shopId: opts.shopId,
                                items: options.variables.items.map((i) => ({ itemId: i.id, quantity: i.quantity })),
                            },
                        },
                    });
                    const serverBatch = data?.checkoutCart;
                    if (serverBatch) {
                        store.setRow('checkoutHistory', serverBatch.id, {
                            shopId: serverBatch.shopId,
                            soldAt: serverBatch.soldAt,
                            totalItems: serverBatch.totalItems,
                            totalCost: serverBatch.totalCost,
                            grossSale: serverBatch.grossSale,
                            grossProfit: serverBatch.grossProfit,
                            itemsJson: JSON.stringify(serverBatch.items ?? []),
                            _dirty: false,
                            _serverSynced: true,
                            _deleted: false,
                        });
                        (serverBatch.items ?? []).forEach((lineItem: any) => {
                            const existing = store.getRow('inventory', lineItem.inventoryItemId);
                            if (existing && Object.keys(existing).length > 0 && !existing._dirty) {
                                store.setCell(
                                    'inventory',
                                    lineItem.inventoryItemId,
                                    'stockQuantity',
                                    Math.max(0, (existing.stockQuantity as number || 0) - lineItem.quantity)
                                );
                                store.setCell('inventory', lineItem.inventoryItemId, '_serverSynced', true);
                            }
                        });
                    }
                    opts.onCompleted?.(data);
                } else {
                    const id = crypto.randomUUID();

                    const lineItems = options.variables.items.map((cartItem) => {
                        const invRow = store.getRow('inventory', cartItem.id) as any;
                        const costPrice = invRow?.costPrice || 0;
                        return {
                            id: crypto.randomUUID(),
                            inventoryItemId: cartItem.id,
                            itemName: cartItem.itemName,
                            quantity: cartItem.quantity,
                            costPrice,
                            sellingPrice: cartItem.sellingPrice,
                            lineCostTotal: costPrice * cartItem.quantity,
                            lineSaleTotal: cartItem.sellingPrice * cartItem.quantity,
                        };
                    });

                    const totalItems = lineItems.reduce((sum, i) => sum + i.quantity, 0);
                    const totalCost = lineItems.reduce((sum, i) => sum + i.lineCostTotal, 0);
                    const grossSale = lineItems.reduce((sum, i) => sum + i.lineSaleTotal, 0);
                    const grossProfit = grossSale - totalCost;

                    const record = {
                        shopId: opts.shopId,
                        soldAt: new Date().toISOString(),
                        totalItems,
                        totalCost,
                        grossSale,
                        grossProfit,
                        itemsJson: JSON.stringify(lineItems),
                        _dirty: true,
                        _serverSynced: false,
                        _deleted: false,
                    };
                    store.setRow('checkoutHistory', id, record);

                    options.variables.items.forEach((cartItem) => {
                        const existing = store.getRow('inventory', cartItem.id);
                        if (existing && Object.keys(existing).length > 0) {
                            const newStock = (existing.stockQuantity as number || 0) - cartItem.quantity;
                            store.setCell('inventory', cartItem.id, 'stockQuantity', Math.max(0, newStock));
                            store.setCell('inventory', cartItem.id, 'updatedAt', new Date().toISOString());
                            store.setCell('inventory', cartItem.id, '_dirty', true);
                        }
                    });

                    opts.onCompleted?.({ checkoutCart: { id, ...record, items: lineItems } });
                }
            } catch (err) {
                opts.onError?.(err);
            }
        },
        [opts.isSubscribed, store, opts.shopId]
    );

    return [checkoutCart, { loading: opts.isSubscribed ? loading : false }] as const;
}