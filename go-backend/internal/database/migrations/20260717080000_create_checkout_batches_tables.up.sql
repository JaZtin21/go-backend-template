CREATE TABLE IF NOT EXISTS checkout_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL,
    sold_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_items INT NOT NULL DEFAULT 0,
    total_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    gross_sale DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    gross_profit DECIMAL(12, 2) NOT NULL DEFAULT 0.00,

    CONSTRAINT fk_checkout_batch_shop FOREIGN KEY (shop_id)
        REFERENCES shops(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS checkout_batch_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkout_batch_id UUID NOT NULL,
    inventory_item_id UUID NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    cost_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    line_cost_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    line_sale_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,

    CONSTRAINT fk_checkout_batch_item_batch FOREIGN KEY (checkout_batch_id)
        REFERENCES checkout_batches(id) ON DELETE CASCADE,
    CONSTRAINT fk_checkout_batch_item_inventory FOREIGN KEY (inventory_item_id)
        REFERENCES inventory_items(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_checkout_batches_shop_sold_at
    ON checkout_batches(shop_id, sold_at DESC);

CREATE INDEX IF NOT EXISTS idx_checkout_batch_items_batch
    ON checkout_batch_items(checkout_batch_id);

CREATE INDEX IF NOT EXISTS idx_checkout_batch_items_inventory
    ON checkout_batch_items(inventory_item_id);
