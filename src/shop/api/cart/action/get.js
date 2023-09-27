import { create_cart, create_guest_cart } from '@src/shop/api/cart/create';
import { get_cart, get_guest_cart } from '@src/shop/api/cart/get';
import { valid } from '@src/shop/api/customer/valid.js';
import { is_guest_token } from '@src/shop/api/cart/is_guest_token';

export async function get_cart_action(store, email_or_cart_token, bearer_token, is_prod = false) {
    /**
     * email is guest or the guest cart token
     */
    const is_guest = is_guest_token(email_or_cart_token);
    if (is_guest) {
        const [create_guest_cart_error, guest_cart_meta] = await create_guest_cart(store, email_or_cart_token, is_prod);
        if (create_guest_cart_error) {
            return {
                error: create_guest_cart_error,
                status: 500,
                cart: undefined,
            };
        }
        const [get_guest_cart_error, guest_cart] = await get_guest_cart(store, guest_cart_meta?.cart_id || email_or_cart_token, is_prod);
        if (get_guest_cart_error) {
            return {
                error: get_guest_cart_error,
                status: 500,
                cart: undefined,
            };
        }
        return {
            error: undefined,
            status: 200,
            cart: guest_cart,
        };
    }
    // customer
    const [valid_error, base_customer] = await valid(email_or_cart_token, bearer_token);
    if (valid_error) {
        return {
            error: valid_error,
            status: 403,
            cart: undefined,
        };
    }

    const [create_cart_error, cart_meta] = await create_cart(store, email_or_cart_token, base_customer?.id, is_prod);
    if (create_cart_error) {
        return {
            error: create_cart_error,
            status: 500,
            cart: undefined,
        };
    }

    // load the customer cart
    const [get_cart_error, cart] = await get_cart(store, cart_meta?.id, is_prod);
    if (get_cart_error) {
        return {
            error: get_cart_error,
            status: 500,
            cart: undefined,
        };
    }
    return {
        error: undefined,
        status: 200,
        cart,
    };
}
