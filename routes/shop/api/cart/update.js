import { get_cart_action } from '@src/shop/api/cart/action/get';
import { update_cart_action } from '@src/shop/api/cart/action/update';
import { validate_store } from '@src/shop/core/validate_store.js';

export default {
    url: '/[store]/api/cart/[email]/',
    _wyvr: () => {
        return {
            methods: ['put', 'post'],
        };
    },
    onExec: async ({ body, params, returnJSON, headers, isProd }) => {
        if (!validate_store(params?.store)) {
            return returnJSON({}, 404);
        }
        const body_is_valid =
            body &&
            Object.entries(body).every(([sku, qty]) => {
                return (
                    typeof sku === 'string' && sku && typeof qty === 'number'
                );
            });
        if (!body_is_valid) {
            return returnJSON({ message: __('cart.invalid_cart_error') }, 400);
        }

        const cart_result = await get_cart_action(
            params.store,
            params.email,
            headers?.authorization,
            isProd
        );
        if (cart_result.error) {
            return returnJSON(
                { message: cart_result.error },
                cart_result.status
            );
        }

        const updated_cart_result = await update_cart_action(
            params.store,
            params.email,
            cart_result.cart,
            body,
            isProd
        );
        if (updated_cart_result.error) {
            return returnJSON(
                { message: updated_cart_result.error },
                updated_cart_result.status
            );
        }
        return returnJSON(updated_cart_result.cart);
    },
};
