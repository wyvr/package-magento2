export function cart_model(guest, id, data) {
    const cart = {
        guest: !!guest,
        id,
        cart_id: id,
        items: [],
        count: 0,
        qty: 0,
        created_at: undefined,
        updated_at: undefined
    };
    if (!data) {
        return cart;
    }
    // normalize items
    if (Array.isArray(data.items)) {
        cart.items = data.items.map((item) => ({
            item_id: item.item_id,
            sku: item.sku,
            qty: item.qty,
            price: item.price
        }));
    }
    if (typeof data.items_count === 'number') {
        cart.count = data.items_count;
    }
    if (typeof data.items_qty === 'number') {
        cart.qty = data.items_qty;
    }
    if (typeof data.created_at === 'string') {
        cart.created_at = data.created_at;
    }
    if (typeof data.updated_at === 'string') {
        cart.updated_at = data.updated_at;
    }
    if (guest) {
        cart.id = data.id;
    }
    return cart;
}
