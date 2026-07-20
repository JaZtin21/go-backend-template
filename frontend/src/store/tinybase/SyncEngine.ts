// tinybase/syncEngine.ts
//
// Reconciles TinyBase (local) with your real backend. Runs ONLY when
// syncAll() is called explicitly — e.g. from the "Sync now" button — never
// automatically. Built against your actual GraphQL schema/resolvers:
// every mutation takes a single `input` object (with id fields embedded
// inside it), and photo uploads go DIRECTLY in the mutation as an Upload
// scalar — there's no separate upload endpoint. Create mutations take
// `photo: Upload`; update mutations split it into `photo: String` (existing
// URL to keep) + `newPhoto: Upload` (new file to upload).

import type { Store } from 'tinybase';
import client from '../../config/apolloClient';
import {
    GET_MY_SHOPS_QUERY,
    GET_SHOP_INVENTORY_QUERY,
    GET_CHECKOUT_HISTORY_QUERY,
    GET_ITEM_ACTION_HISTORY_QUERY,
    CREATE_SHOP_MUTATION,
    UPDATE_SHOP_MUTATION,
    DELETE_SHOP_MUTATION,
    ADD_INVENTORY_ITEM_MUTATION,
    UPDATE_INVENTORY_ITEM_MUTATION,
    DELETE_INVENTORY_ITEM_MUTATION,
    CHECKOUT_CART_MUTATION,
} from '~/api/graphql';
import { base64ToFile } from '~/utils/imageUtils';

// -------------------------------------------------------------------------
// PHOTO HELPERS — no upload endpoint needed. Create mutations take the File
// directly; update mutations need photo (keep-existing) OR newPhoto (replace).
// -------------------------------------------------------------------------
function photoForCreate(photo: string): File | undefined {
    if (photo && photo.startsWith('data:')) return base64ToFile(photo, 'photo.jpg');
    return undefined; // no photo set — field just omitted
}

function splitPhotoForUpdate(photo: string): { photo?: string; newPhoto?: File } {
    if (photo && photo.startsWith('data:')) {
        // taken/added offline, never uploaded yet — send as the new file
        return { newPhoto: base64ToFile(photo, 'photo.jpg') };
    }
    return { photo: photo || undefined }; // already a real URL — keep it as-is
}

// Walks every page of a paginated query using the response's `totalCount`
// to know exactly when to stop.
async function fetchAllPages<T>(
    fetchPage: (offset: number, limit: number) => Promise<{ items: T[]; totalCount: number }>,
    pageSize = 100
): Promise<T[]> {
    const all: T[] = [];
    let offset = 0;
    let totalCount = Infinity;

    while (all.length < totalCount) {
        const { items, totalCount: count } = await fetchPage(offset, pageSize);
        totalCount = count;
        if (items.length === 0) break;
        all.push(...items);
        offset += pageSize;
    }

    return all;
}

// =========================================================================
// SHOPS
// =========================================================================

export async function pushLocalShops(store: Store) {
    const shops = store.getTable('shops');

    for (const [id, row] of Object.entries(shops) as [string, any][]) {
        if (!row._dirty) continue;

        try {
            if (row._deleted) {
                if (row._serverSynced) {
                    await client.mutate({ mutation: DELETE_SHOP_MUTATION, variables: { shopId: id } });
                }
                store.delRow('shops', id);
                continue;
            }

            // Only fields your CreateShopInput/UpdateShopInput actually accept —
            // NOT businessType/rating/status/verification/createdBy, which exist
            // on your frontend Shop type but aren't in the backend input schema.
            const shopFields = {
                shopName: row.shopName,
                address: row.address,
                description: row.description,
                coordinates: JSON.parse(row.coordinatesJson || '{"lat":0,"lng":0}'),
                businessHours: JSON.parse(row.businessHoursJson || '{"openTime":"","closeTime":"","days":[]}'),
                paymentMethods: JSON.parse(row.paymentMethodsJson || '{"cash":false,"gcash":false,"paymaya":false,"card":false}'),
                delivery: JSON.parse(row.deliveryJson || '{"available":false}'),
                socialMedia: JSON.parse(row.socialMediaJson || '{}'),
                contactDetails: JSON.parse(row.contactDetailsJson || '{}'),
            };

            if (row._serverSynced) {
                const { photo, newPhoto } = splitPhotoForUpdate(row.photo);
                const { data } = await client.mutate({
                    mutation: UPDATE_SHOP_MUTATION,
                    variables: { input: { shopId: id, ...shopFields, photo, newPhoto, photos: JSON.parse(row.photosJson || '[]') } },
                });
                const serverShop = data?.updateShop;
                store.setPartialRow('shops', id, { photo: serverShop?.photo ?? row.photo, _dirty: false });
            } else {
                const { data } = await client.mutate({
                    mutation: CREATE_SHOP_MUTATION,
                    variables: { input: { ...shopFields, photo: photoForCreate(row.photo) } },
                });
                const serverShop = data?.createShop;

                if (serverShop?.id && serverShop.id !== id) {
                    // backend assigned its own id — migrate the local row to it
                    store.delRow('shops', id);
                    store.setRow('shops', serverShop.id, { ...row, photo: serverShop.photo ?? row.photo, _dirty: false, _serverSynced: true });
                } else {
                    store.setPartialRow('shops', id, { photo: serverShop?.photo ?? row.photo, _dirty: false, _serverSynced: true });
                }
            }
        } catch (err) {
            console.error(`Failed to push shop ${id} — left dirty, will retry next sync:`, err);
        }
    }
}

export async function pullCloudShops(store: Store) {
    const allShops = await fetchAllPages<any>(async (offset, limit) => {
        const { data } = await client.query({
            query: GET_MY_SHOPS_QUERY,
            variables: { limit, offset },
            fetchPolicy: 'network-only',
        });
        return {
            items: data?.getMyShops?.shops ?? [],
            totalCount: data?.getMyShops?.totalCount ?? 0,
        };
    });

    const fetchedIds = new Set<string>();

    for (const shop of allShops) {
        fetchedIds.add(shop.id);
        const localRow = store.getRow('shops', shop.id);
        if (localRow?._dirty) continue;

        store.setRow('shops', shop.id, {
            shopName: shop.shopName ?? '',
            description: shop.description ?? '',
            address: shop.address ?? '',
            coordinatesJson: JSON.stringify(shop.coordinates ?? { lat: 0, lng: 0 }),
            photo: shop.photo ?? '',
            photosJson: JSON.stringify(shop.photos ?? []),
            businessHoursJson: JSON.stringify(shop.businessHours ?? {}),
            businessType: '', // not present in your backend schema — kept for local UI use only
            paymentMethodsJson: JSON.stringify(shop.paymentMethods ?? {}),
            deliveryJson: JSON.stringify(shop.delivery ?? {}),
            socialMediaJson: JSON.stringify(shop.socialMedia ?? {}),
            verificationJson: JSON.stringify(shop.verification ?? {}),
            contactDetailsJson: JSON.stringify(shop.contactDetails ?? {}),
            rating: 0, // not present in your backend schema — kept for local UI use only
            createdAt: shop.createdAt ?? '',
            updatedAt: shop.updatedAt ?? '',
            createdBy: shop.ownerId ?? '', // your Shop TS type says createdBy, backend field is ownerId — worth reconciling on your end
            status: shop.status?.isActive ? 'ACTIVE' : 'INACTIVE', // backend sends { isActive: bool }, not a string — adjust if your TS type changes to match
            _dirty: false,
            _serverSynced: true,
            _deleted: false,
        });
    }

    const localShops = store.getTable('shops');
    for (const [id, row] of Object.entries(localShops) as [string, any][]) {
        if (row._serverSynced && !row._dirty && !fetchedIds.has(id)) {
            store.delRow('shops', id);
        }
    }
}

// =========================================================================
// INVENTORY
// =========================================================================

export async function pushLocalInventory(store: Store) {
    const inventory = store.getTable('inventory');

    for (const [id, row] of Object.entries(inventory) as [string, any][]) {
        if (!row._dirty) continue;

        try {
            if (row._deleted) {
                if (row._serverSynced) {
                    await client.mutate({ mutation: DELETE_INVENTORY_ITEM_MUTATION, variables: { itemId: id } });
                }
                store.delRow('inventory', id);
                continue;
            }

            const itemFields = {
                itemName: row.itemName,
                description: row.description,
                barcode: row.barcode,
                category: row.category,
                unitOfMeasure: row.unitOfMeasure,
                costPrice: row.costPrice,
                sellingPrice: row.sellingPrice,
                stockQuantity: row.stockQuantity,
                reorderLevel: row.reorderLevel,
            };

            if (row._serverSynced) {
                const { photo, newPhoto } = splitPhotoForUpdate(row.photo);
                const { data } = await client.mutate({
                    mutation: UPDATE_INVENTORY_ITEM_MUTATION,
                    variables: { input: { itemId: id, ...itemFields, photo, newPhoto } },
                });
                const serverItem = data?.updateInventoryItem;
                store.setPartialRow('inventory', id, { photo: serverItem?.photo ?? row.photo, _dirty: false });
            } else {
                const { data } = await client.mutate({
                    mutation: ADD_INVENTORY_ITEM_MUTATION,
                    variables: { input: { shopId: row.shopId, ...itemFields, photo: photoForCreate(row.photo) } },
                });
                const serverItem = data?.addInventoryItem;

                if (serverItem?.id && serverItem.id !== id) {
                    store.delRow('inventory', id);
                    store.setRow('inventory', serverItem.id, { ...row, photo: serverItem.photo ?? row.photo, _dirty: false, _serverSynced: true });
                } else {
                    store.setPartialRow('inventory', id, { photo: serverItem?.photo ?? row.photo, _dirty: false, _serverSynced: true });
                }
            }
        } catch (err) {
            console.error(`Failed to push inventory item ${id} — left dirty, will retry next sync:`, err);
        }
    }
}

export async function pullCloudInventory(store: Store) {
    const shopIds = store.getRowIds('shops');

    for (const shopId of shopIds) {
        const items = await fetchAllPages<any>(async (offset, limit) => {
            const { data } = await client.query({
                query: GET_SHOP_INVENTORY_QUERY,
                variables: { shopId, limit, offset },
                fetchPolicy: 'network-only',
            });
            return {
                items: data?.getShopInventory?.items ?? [],
                totalCount: data?.getShopInventory?.totalCount ?? 0,
            };
        });

        const fetchedIds = new Set<string>();

        for (const item of items) {
            fetchedIds.add(item.id);
            const localRow = store.getRow('inventory', item.id);
            if (localRow?._dirty) continue;

            store.setRow('inventory', item.id, {
                shopId: item.shopId ?? shopId,
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
                updatedAt: item.updatedAt ?? '',
                _dirty: false,
                _serverSynced: true,
                _deleted: false,
            });
        }

        const localInventory = store.getTable('inventory');
        for (const [id, row] of Object.entries(localInventory) as [string, any][]) {
            if (row.shopId === shopId && row._serverSynced && !row._dirty && !fetchedIds.has(id)) {
                store.delRow('inventory', id);
            }
        }
    }
}

// =========================================================================
// CHECKOUT HISTORY — create-only (a completed sale is never edited), and
// your backend computes cost/price/totals itself, so the push only needs
// to send { itemId, quantity } pairs.
// =========================================================================

export async function pushLocalCheckoutHistory(store: Store) {
    const checkouts = store.getTable('checkoutHistory');

    for (const [id, row] of Object.entries(checkouts) as [string, any][]) {
        if (!row._dirty || row._serverSynced) continue;

        try {
            const localItems = JSON.parse(row.itemsJson || '[]') as any[];
            const { data } = await client.mutate({
                mutation: CHECKOUT_CART_MUTATION,
                variables: {
                    input: {
                        shopId: row.shopId,
                        items: localItems.map((i) => ({ itemId: i.inventoryItemId, quantity: i.quantity })),
                    },
                },
            });

            const serverBatch = data?.checkoutCart;
            store.delRow('checkoutHistory', id); // drop the locally-estimated version

            if (serverBatch?.id) {
                // replace with the server's authoritative batch (real totals, real id)
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
            }
        } catch (err) {
            console.error(`Failed to push checkout ${id} — left dirty, will retry next sync:`, err);
            // NOTE: if this fails, stock was never decremented server-side for this
            // sale. It'll retry next sync. Don't re-queue it a second way in the
            // meantime, or you risk a double-decrement once it does succeed.
        }
    }
}

export async function pullCloudCheckoutHistory(store: Store) {
    const shopIds = store.getRowIds('shops');

    for (const shopId of shopIds) {
        const batches = await fetchAllPages<any>(async (offset, limit) => {
            const { data } = await client.query({
                query: GET_CHECKOUT_HISTORY_QUERY,
                variables: { shopId, limit, offset },
                fetchPolicy: 'network-only',
            });
            return {
                items: data?.getCheckoutHistory?.batches ?? [],
                totalCount: data?.getCheckoutHistory?.totalCount ?? 0,
            };
        });

        for (const batch of batches) {
            const localRow = store.getRow('checkoutHistory', batch.id);
            if (localRow?._dirty) continue;

            store.setRow('checkoutHistory', batch.id, {
                shopId: batch.shopId ?? shopId,
                soldAt: batch.soldAt ?? '',
                totalItems: batch.totalItems ?? 0,
                totalCost: batch.totalCost ?? 0,
                grossSale: batch.grossSale ?? 0,
                grossProfit: batch.grossProfit ?? 0,
                itemsJson: JSON.stringify(batch.items ?? []),
                _dirty: false,
                _serverSynced: true,
                _deleted: false,
            });
        }
        // no orphan-reconciliation here — checkout batches aren't deleted in normal operation
    }
}

// =========================================================================
// ITEM ACTION HISTORY — pull-only. Your backend writes these itself as a
// side effect of AddInventoryItem/UpdateInventoryItem/DeleteInventoryItem/
// IncrementStock — there's no client-facing mutation to push here.
// =========================================================================

export async function pullCloudItemActionHistory(store: Store) {
    const shopIds = store.getRowIds('shops');

    for (const shopId of shopIds) {
        const records = await fetchAllPages<any>(async (offset, limit) => {
            const { data } = await client.query({
                query: GET_ITEM_ACTION_HISTORY_QUERY,
                variables: { shopId, limit, offset },
                fetchPolicy: 'network-only',
            });
            return {
                items: data?.getItemActionHistory?.records ?? [],
                totalCount: data?.getItemActionHistory?.totalCount ?? 0,
            };
        });

        for (const record of records) {
            store.setRow('itemActionHistory', record.id, {
                shopId: record.shopId ?? shopId,
                inventoryItemId: record.inventoryItemId ?? '',
                itemName: record.itemName ?? '',
                action: record.action ?? '',
                quantity: record.quantity ?? 0,
                date: record.date ?? '',
                _serverSynced: true,
            });
        }
    }
}

// =========================================================================
// syncAll — call this ONLY from a manual "Sync now" action.
//
// ORDER MATTERS: checkout must push BEFORE inventory is pulled — your
// CheckoutCart resolver decrements stock server-side as part of building
// the batch, so pulling inventory afterward brings back the correct,
// server-authoritative stock numbers. Inventory push happens first so any
// genuine offline price/detail edits reach the server before checkout
// touches stock, but note: checkout-driven local stock changes are never
// marked dirty (see useCheckoutCart), specifically so pushLocalInventory
// never re-sends a stock change that CheckoutCart is about to apply itself
// — that would double-decrement.
// =========================================================================
let isSyncRunning = false;

export async function syncAll(store: Store): Promise<void> {
    if (isSyncRunning) {
        console.log('Sync already in progress — skipping this call.');
        return;
    }
    isSyncRunning = true;
    try {
        await pushLocalShops(store);
        await pullCloudShops(store);
        await pushLocalInventory(store);
        await pushLocalCheckoutHistory(store);
        await pullCloudInventory(store);
        await pullCloudCheckoutHistory(store);
        await pullCloudItemActionHistory(store);
    } finally {
        isSyncRunning = false;
    }
}