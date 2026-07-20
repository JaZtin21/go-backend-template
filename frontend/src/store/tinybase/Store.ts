// tinybase/store.ts
//
// TinyBase cells only hold string/number/boolean — nested objects/arrays on
// Shop (coordinates, businessHours, paymentMethods, delivery, socialMedia,
// verification, contactDetails, photos) are stored as JSON strings and
// packed/unpacked in shopHooks.ts. Item has no nested fields, so its table
// maps 1:1.

import { createStore, type Store } from 'tinybase';

export function createShopStore(): Store {
    return createStore().setTablesSchema({
        shops: {
            shopName: { type: 'string' },
            description: { type: 'string' },
            address: { type: 'string' },
            coordinatesJson: { type: 'string' }, // { lat, lng }
            photo: { type: 'string' }, // stores the URL string; File objects aren't persisted offline
            photosJson: { type: 'string' }, // string[]
            businessHoursJson: { type: 'string' }, // { openTime, closeTime, days }
            businessType: { type: 'string' },
            paymentMethodsJson: { type: 'string' }, // { cash, gcash, paymaya, card }
            deliveryJson: { type: 'string' }, // { available, radius, fee, minOrder }
            socialMediaJson: { type: 'string' }, // { facebook, instagram }
            verificationJson: { type: 'string' }, // { isVerified, verifiedDate, verificationId }
            contactDetailsJson: { type: 'string' }, // { phone, email, address }
            rating: { type: 'number' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
            createdBy: { type: 'string' },
            status: { type: 'string' },
            // --- sync tracking ---
            _dirty: { type: 'boolean', default: false }, // edited offline, not yet pushed
            _serverSynced: { type: 'boolean', default: false }, // has ever reached the backend
            _deleted: { type: 'boolean', default: false }, // soft-deleted offline, needs deleting on server too
        },
        inventory: {
            shopId: { type: 'string' },
            itemName: { type: 'string' },
            description: { type: 'string' },
            barcode: { type: 'string' },
            category: { type: 'string' },
            unitOfMeasure: { type: 'string' },
            photo: { type: 'string' },
            sellingPrice: { type: 'number' },
            stockQuantity: { type: 'number' },
            costPrice: { type: 'number' },
            reorderLevel: { type: 'number' },
            updatedAt: { type: 'string' },
            _dirty: { type: 'boolean', default: false },
            _serverSynced: { type: 'boolean', default: false },
            _deleted: { type: 'boolean', default: false },
        },
        checkoutHistory: {
            shopId: { type: 'string' },
            soldAt: { type: 'string' },
            totalItems: { type: 'number' },
            totalCost: { type: 'number' },
            grossSale: { type: 'number' },
            grossProfit: { type: 'number' },
            itemsJson: { type: 'string' }, // [{ id, inventoryItemId, itemName, quantity, costPrice, sellingPrice, lineCostTotal, lineSaleTotal }]
            _dirty: { type: 'boolean', default: false },
            _serverSynced: { type: 'boolean', default: false },
            _deleted: { type: 'boolean', default: false },
        },
        itemActionHistory: {
            shopId: { type: 'string' },
            inventoryItemId: { type: 'string' },
            itemName: { type: 'string' },
            action: { type: 'string' },
            quantity: { type: 'number' },
            date: { type: 'string' },
            _serverSynced: { type: 'boolean', default: false }, // pull-only: server generates these as a side effect of other mutations
        },
    });
}