import { Logger } from '@wyvr/generator/src/utils/logger.js';

import { magentoUrl, authOptions, post } from '@src/shop/api/api';
import { get_admin_token } from '@src/shop/logic/get_admin_token.mjs';

import * as DB from '@src/magento2/database/customer.js';
import { load_cart } from '@src/shop/api/cart/load';

export async function create_cart(store, email, customer_id, isProd) {
    // try load the cart from storage
    const loaded_cart = await load_cart(email);
    if (loaded_cart) {
        return [undefined, loaded_cart];
    }

    const admin_token = await get_admin_token(isProd);
    if (!admin_token) {
        Logger.error('magento2 create cart, missing admin token');
        return [__('shop.internal_error'), undefined];
    }
    let post_url = magentoUrl(`/rest/all/V1/customers/${customer_id}/carts`);

    let cart_result;
    try {
        cart_result = await post(post_url, authOptions(admin_token, {}));
        if (!cart_result.ok) {
            Logger.warning(
                'magento2 create cart, request failed',
                cart_result.status,
                cart_result.statusText,
                cart_result.body
            );
            return [__('shop.internal_error'), undefined];
        }
    } catch (e) {
        Logger.error(get_error_message(e, post_url, 'magento2 create cart'));
        return returnJSON({ message: __('shop.internal_error') }, 500);
    }

    // store the current cart in the storage
    const cart = {
        email: email,
        customer_id: customer_id,
        id: cart_result?.body,
        // cache for 1 day (24h*60m*1000ms)
        valid_until: new Date().getTime() + 1440000,
    };
    try {
        await DB.open();
        await DB.set('cart', email, cart);
        await DB.close();
    } catch (e) {
        Logger.error(get_error_message(e, post_url, 'magento2 create cart save'));
    }
    return [undefined, cart];
}

export async function create_guest_cart(store, id, isProd) {
    const admin_token = await get_admin_token(isProd);
    if (!admin_token) {
        Logger.error('magento2 create cart, missing admin token');
        return [__('shop.internal_error'), undefined];
    }
    const cart = {
        guest: true,
        id,
    };
    if (id != 'guest') {
        return [undefined, cart];
    }

    // create a new one
    const post_url = magentoUrl(`/rest/all/V1/guest-carts`);

    let cart_result;
    try {
        cart_result = await post(post_url, authOptions(admin_token, {}));
        if (!cart_result.ok) {
            Logger.warning(
                'magento2 create guest cart, request failed',
                cart_result.status,
                cart_result.statusText,
                cart_result.body
            );
            return [__('shop.internal_error'), undefined];
        }
    } catch (e) {
        Logger.error(get_error_message(e, post_url, 'magento2 create guest cart'));
        return returnJSON({ message: __('shop.internal_error') }, 500);
    }
    cart.id = cart_result?.body;
    return [undefined, cart];
}
