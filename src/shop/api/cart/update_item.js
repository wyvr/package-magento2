import { logger, get_error_message } from '@wyvr/generator/universal.js';
import { jsonOptions, magentoUrl, get, authOptions, post, del } from '@src/shop/api/api';
import { get_admin_token } from '@src/shop/logic/get_admin_token.js';
import { cart_model } from '@src/shop/api/cart/cart_model';

export async function update_cart_item(store, cart, sku, qty, is_prod) {
    const url = magentoUrl(`/rest/${store}/V1/carts/${cart.cart_id}/items`);
    return await update_item(url, cart, sku, qty, is_prod);
}
export async function update_guest_cart_item(store, cart, sku, qty, is_prod) {
    const url = magentoUrl(`/rest/${store}/V1/guest-carts/${cart.cart_id}/items`);
    return await update_item(url, cart, sku, qty, is_prod);
}
async function update_item(url, cart, sku, qty, is_prod) {
    const admin_token = await get_admin_token(is_prod);
    if (!admin_token) {
        logger.error('magento2 update cart item, missing admin token');
        return [__('shop.internal_error'), undefined];
    }

    const cart_item = {
        sku,
        qty,
        quote_id: cart.cart_id
    };
    const item_id = cart.items.find((item) => item.sku === sku)?.item_id;
    if (item_id) {
        cart_item.item_id = item_id;
    }

    let result;
    try {
        if (qty > 0) {
            // add or update item
            result = await post(
                url,
                authOptions(
                    admin_token,
                    jsonOptions({
                        body: {
                            cart_item
                        }
                    })
                )
            );
        } else {
            // delete the item
            if (!item_id) {
                return [__('cart.delete_error', { sku }), undefined];
            }
            result = await del(`${url.replace(/\/$/, '')}/${item_id}`, authOptions(admin_token, jsonOptions({})));
        }
        if (!result.ok) {
            logger.warning('magento2 update cart item, request failed', result.status, result.statusText, result.body);
            return [result?.body?.message || __('shop.internal_error'), undefined];
        }
    } catch (e) {
        logger.error(get_error_message(e, url, 'magento2 update cart item'));
        return [__('shop.internal_error'), undefined];
    }

    return [undefined, result?.body];
}
