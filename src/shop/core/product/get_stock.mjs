import { get_attribute_value } from '../attributes.mjs';
import { default_stock } from '@src/shop/core/product/default_stock.mjs';

export function get_stock(product) {
    // get stock of product itself
    const stock = get_single_stock(product);

    // configurables does not have a stock themself, so get the stock from the variants
    if (product?.type_id === 'configurable' && product?.configurable_products) {
        const child_stocks = product.configurable_products.map((child) => get_single_stock(child)).filter(Boolean);
        stock.is_in_stock = child_stocks.find((s) => s.is_in_stock === '1') != null;
        stock.qty = Math.max(...child_stocks.map((s) => parseFloat(s.qty)));
    }
    // normalize the needed params
    if (typeof stock.qty === 'string') {
        stock.qty = parseFloat(stock.qty);
    }
    if (typeof stock.is_in_stock === 'string') {
        stock.is_in_stock = stock.is_in_stock === '1';
    }
    return stock;
}

function get_single_stock(product) {
    const stock = { ...default_stock };
    const stock_attr = get_attribute_value(product, 'stock');
    if (stock_attr) {
        for (const [key, value] of Object.entries(stock_attr)) {
            stock[key] = value;
        }
    }
    const status_attr = get_attribute_value(product, 'quantity_and_stock_status');
    if (status_attr) {
        for (const [key, value] of Object.entries(status_attr)) {
            stock[key] = value;
        }
    }
    return stock;
}
