import { get_cart_action } from '@src/shop/api/cart/action/get';
import { validate_store } from '@src/shop/core/validate_store.js';

export default {
    url: '/[store]/api/cart/[email]/',
    _wyvr: () => {
        return {
            methods: ['get']
        };
    },
    onExec: async ({ params, returnJSON, headers, isProd }) => {
        if (!validate_store(params?.store)) {
            return returnJSON({}, 404);
        }
        const cart_result = await get_cart_action(params.store, params.email, headers?.authorization, isProd);
        if (cart_result.error) {
            return returnJSON({ message: cart_result.error }, cart_result.status);
        }

        return returnJSON(cart_result.cart);
    }
};
