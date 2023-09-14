import { get_attribute_value } from '../attributes.mjs';

export function get_stock(product) {
    const stock = {
        is_in_stock: false,
        qty: 0,
    };
    const stock_attr = get_attribute_value(product, 'stock');
    if (stock_attr) {
        Object.entries(stock_attr).forEach(([key, value]) => (stock[key] = value));
    }
    const status_attr = get_attribute_value(product, 'quantity_and_stock_status');
    if (status_attr) {
        Object.entries(status_attr).forEach(([key, value]) => (stock[key] = value));
    }
    if (product?.type_id == 'configurable' && product?.configurable_products) {
        const child_stocks = product.configurable_products
            .map((child) => get_attribute_value(child, 'stock'))
            .filter(Boolean);
        stock.is_in_stock = child_stocks.find((s) => s.is_in_stock == '1') != null;
        stock.qty = Math.max(...child_stocks.map((s) => parseFloat(s.qty)));
    }
    if (typeof stock.qty == 'string') {
        stock.qty = parseFloat(stock.qty);
    }
    if (typeof stock.is_in_stock == 'string') {
        stock.is_in_stock = stock.is_in_stock === '1';
    }
    return stock;
}
