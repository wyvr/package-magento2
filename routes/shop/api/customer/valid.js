import { valid } from '@src/shop/api/customer/valid.js';
import { validate_store } from '@src/shop/core/validate_store.js';

export default {
    url: '/[store]/api/customer/valid/[email]/',
    _wyvr: () => {
        return {
            methods: ['get'],
        };
    },
    onExec: async ({ params, returnJSON, headers }) => {
        if (!validate_store(params?.store)) {
            return returnJSON({}, 404);
        }
        const [error, customer] = await valid(
            params.email,
            headers?.authorization
        );
        if (error) {
            return returnJSON({ message: error }, 403);
        }
        return returnJSON(customer);
    },
};
