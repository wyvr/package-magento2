import { create_cart, create_guest_cart } from '@src/shop/api/cart/create';
import { get_cart, get_guest_cart } from '@src/shop/api/cart/get';
import { valid } from '@src/shop/api/customer/valid.js';
import { is_guest_token } from '@src/shop/api/cart/is_guest_token';
import { logger } from '@wyvr/generator/universal.js';

export async function get_cart_action(store, email_or_cart_token, bearer_token, is_prod = false) {
    /**
     * email is guest or the guest cart token
     */
    const is_guest = is_guest_token(email_or_cart_token);
    if (is_guest) {
        const [create_guest_cart_error, guest_cart_meta] = await create_guest_cart(store, email_or_cart_token, is_prod);
        if (create_guest_cart_error) {
            return end(create_guest_cart_error, undefined);
        }
        const [get_guest_cart_error, guest_cart] = await get_guest_cart(store, guest_cart_meta?.cart_id || email_or_cart_token, is_prod);

        if (get_guest_cart_error) {
            // try load a new guest cart
            const [new_create_guest_cart_error, new_guest_cart_meta] = await create_guest_cart(store, 'guest', is_prod);
            if (new_create_guest_cart_error) {
                return end(get_guest_cart_error, undefined);
            }

            const [new_get_guest_cart_error, new_guest_cart] = await get_guest_cart(store, new_guest_cart_meta?.cart_id, is_prod);
            if(new_guest_cart) {
                logger.success('magento2 get cart, heal guest cart', email_or_cart_token, 'to', new_guest_cart_meta?.cart_id);
            }
            return end(new_get_guest_cart_error, new_guest_cart);
        }
        return end(undefined, guest_cart);
    }
    // customer
    const [valid_error, base_customer] = await valid(email_or_cart_token, bearer_token);
    if (valid_error) {
        return end(valid_error, undefined, 403);
    }

    const [create_cart_error, cart_meta] = await create_cart(store, email_or_cart_token, base_customer?.id, is_prod);
    if (create_cart_error) {
        return end(create_cart_error, undefined);
    }

    // load the customer cart
    const [get_cart_error, cart] = await get_cart(store, cart_meta?.id, is_prod);
    return end(get_cart_error, cart);
}

function end(error, cart, status) {
    if (error) {
        return {
            error,
            status: status ?? 500,
            cart: undefined
        };
    }
    return {
        error: undefined,
        status: status ?? 200,
        cart
    };
}
