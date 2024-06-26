import { logger, get_error_message } from '@wyvr/generator/universal.js';

import { magentoUrl, authOptions, post } from '@src/shop/api/api';
import { get_admin_token } from '@src/shop/logic/get_admin_token.js';

import * as DB from '@src/magento2/database/customer.js';
import { load_cart } from '@src/shop/api/cart/load';

export async function create_cart(store, email, customer_id, isProd) {
    // try load the cart from storage
    const [loaded_id, loaded_cart] = await load_cart(email);
    if (loaded_cart) {
        return [undefined, loaded_cart];
    }

    const admin_token = await get_admin_token(isProd);
    if (!admin_token) {
        logger.error('magento2 create cart, missing admin token');
        return [__('shop.internal_error'), undefined];
    }
    const post_url = magentoUrl(`/rest/${store}/V1/customers/${customer_id}/carts`);

    const cart = {
        email,
        customer_id,
        id: undefined,
        valid_until: new Date().getTime() + 60000 // cache time 1 minute
    };
    if (loaded_id) {
        cart.id = loaded_id;
    } else {
        let cart_result;
        try {
            cart_result = await post(post_url, authOptions(admin_token, {}));
            if (!cart_result.ok) {
                logger.warning('magento2 create cart, request failed', cart_result.status, cart_result.statusText, cart_result.body);
                return [__('shop.internal_error'), undefined];
            }
        } catch (e) {
            logger.error(get_error_message(e, post_url, 'magento2 create cart'));
            return returnJSON({ message: __('shop.internal_error') }, 500);
        }
        cart.id = cart_result?.body;
    }

    // store the current cart in the storage
    try {
        await DB.open();
        await DB.set('cart', email, cart);
        await DB.close();
    } catch (e) {
        logger.error(get_error_message(e, post_url, 'magento2 create cart save'));
    }
    return [undefined, cart];
}

export async function create_guest_cart(store, id, isProd) {
    const admin_token = await get_admin_token(isProd);
    if (!admin_token) {
        logger.error('magento2 create cart, missing admin token');
        return [__('shop.internal_error'), undefined];
    }
    const cart = {
        guest: true,
        id,
        cart_id: undefined
    };
    if (id !== 'guest') {
        return [undefined, cart];
    }

    // create a new one
    const post_url = magentoUrl(`/rest/${store}/V1/guest-carts`);

    let cart_result;
    try {
        cart_result = await post(post_url, authOptions(admin_token, {}));
        if (!cart_result.ok) {
            logger.warning('magento2 create guest cart, request failed', cart_result.status, cart_result.statusText, cart_result.body);
            return [__('shop.internal_error'), undefined];
        }
    } catch (e) {
        logger.error(get_error_message(e, post_url, 'magento2 create guest cart'));
        return returnJSON({ message: __('shop.internal_error') }, 500);
    }
    cart.cart_id = cart_result?.body;
    return [undefined, cart];
}
