import { Logger } from '@wyvr/generator/src/utils/logger.js';
import { get_error_message } from '@wyvr/generator/src/utils/error.js';
import { get_cart, get_guest_cart } from '@src/shop/api/cart/get';
import { update_cart_item, update_guest_cart_item } from '@src/shop/api/cart/update_item';
import { is_guest_token } from '@src/shop/api/cart/is_guest_token';

export async function update_cart_action(store, email_or_cart_token, cart, data, is_prod = false) {
    const is_guest = is_guest_token(email_or_cart_token);

    let last_result;
    let errors = [];
    try {
        await Promise.all(
            Object.entries(data).map(async ([sku, qty]) => {
                const [error, result] = is_guest
                    ? await update_guest_cart_item(store, cart, sku, qty, is_prod)
                    : await update_cart_item(store, cart, sku, qty, is_prod);
                if (error) {
                    errors.push(error);
                }
                if (result) {
                    last_result = result;
                }
                return null;
            })
        );
    } catch (e) {
        Logger.error(get_error_message(e, import.meta.url, 'magento2 update cart'));
        return { error: __('shop.internal_error'), status: 500, cart: undefined };
    }

    const [final_error, final_cart] = is_guest
        ? await get_guest_cart(store, cart?.id, is_prod)
        : await get_cart(store, cart?.id, is_prod);
    if (final_error) {
        errors.push(final_error);
        return { error: errors, status: 500, cart: undefined };
    }
    if (errors.length > 0) {
        final_cart.message = errors;
    }
    return { error: undefined, status: 200, cart: final_cart };
}
