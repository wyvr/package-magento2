import { validate_store } from '@src/shop/core/validate_store.js';

export default {
    url: '/[store]/api/newsletter/subscribe/',
    _wyvr: () => {
        return {
            methods: ['post'],
        };
    },
    onExec: async ({ params, returnJSON }) => {
        if (!validate_store(params?.store)) {
            return returnJSON({}, 404);
        }
        return returnJSON({ message: 'Not implemented' }, 501);
    },
};
