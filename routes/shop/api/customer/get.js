import { get_customer } from '@src/shop/api/customer/get.js';
import { valid } from '@src/shop/api/customer/valid.js';
import { validate_store } from '@src/shop/core/validate_store.js';

export default {
    url: '/[store]/api/customer/get/[email]/',
    _wyvr: () => {
        return {
            methods: ['get']
        };
    },
    onExec: async ({ params, returnJSON, headers, isProd }) => {
        if (!validate_store(params?.store)) {
            return returnJSON([], 404);
        }
        const [valid_error, base_customer] = await valid(params.email, headers?.authorization);
        if (valid_error) {
            return returnJSON({ message: valid_error }, 403);
        }
        const [get_error, customer] = await get_customer(params.store, base_customer?.id, isProd);
        if (get_error) {
            return returnJSON({ message: get_error }, 403);
        }
        return returnJSON(customer);
    }
};
