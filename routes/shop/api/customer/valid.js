import { valid } from '@src/shop/api/customer/valid.js';

export default {
    url: '/[store]/api/customer/valid/[email]/',
    _wyvr: () => {
        return {
            methods: ['get']
        };
    },
    onExec: async ({ params, returnJSON, headers }) => {
        const [error, customer] = await valid(params.email, headers?.authorization);
        if (error) {
            return returnJSON({ message: error }, 403);
        }
        return returnJSON(customer);
    }
};
