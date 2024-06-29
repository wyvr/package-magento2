import { logger, get_error_message } from '@wyvr/generator/universal.js';
import { jsonOptions, magentoUrl, get, authOptions } from '@src/shop/api/api';
import { get_admin_token } from '@src/shop/logic/get_admin_token.js';
import { cart_model } from '@src/shop/api/cart/cart_model';

export async function get_cart(store, cart_id, is_prod) {
    const url = magentoUrl(`/rest/${store}/V1/carts/${cart_id}`);
    return await load_cart(url, false, cart_id, cart_id, is_prod);
}
export async function get_guest_cart(store, cart_id, is_prod) {
    const url = magentoUrl(`/rest/${store}/V1/guest-carts/${cart_id}`);
    return await load_cart(url, true, cart_id, is_prod);
}
async function load_cart(url, is_guest, cart_id, is_prod) {
    const admin_token = await get_admin_token(is_prod);
    if (!admin_token) {
        logger.error('magento2 get cart, missing admin token');
        return [__('shop.internal_error'), undefined];
    }

    let get_result;
    try {
        get_result = await get(url, authOptions(admin_token, jsonOptions({})));
        if (!get_result.ok) {
            logger.warning('magento2 get cart, request failed', get_result.status, get_result.statusText, get_result.body);
            return [__('shop.internal_error'), undefined];
        }
    } catch (e) {
        logger.error(get_error_message(e, token_url, 'magento2 get cart'));
        return returnJSON({ message: __('shop.internal_error') }, 500);
    }
    return [undefined, cart_model(is_guest, cart_id, get_result?.body)];
}
