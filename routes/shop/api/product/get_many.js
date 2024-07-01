import { get_magento_data } from '@src/magento2/core/data.js';
import { search } from '@src/shop/core/elasticsearch.js';
import { get_product_skus_query } from '@src/shop/core/search/product.js';
import { validate_store } from '@src/shop/core/validate_store.js';

/**
 * @WARN uncacheable entpoint
 */

export default {
    url: '/[store]/api/product/get/',
    _wyvr: () => {
        return {
            methods: ['post'],
        };
    },
    onExec: async ({ data, params, body, returnJSON }) => {
        if (!validate_store(params?.store)) {
            return returnJSON({}, 404);
        }
        if (!Array.isArray(body)) {
            return returnJSON({ message: __('shop.internal_error') }, 400);
        }

        const magento_data = await get_magento_data(data.url);

        const skus = [];
        for (const sku of body) {
            if (typeof sku === 'string') {
                skus.push(sku);
            }
        }

        if (skus.length === 0) {
            return returnJSON([], 400);
        }

        const batches = [];
        const batch_size = 10000;
        for (let i = 0; i < skus.length; i += batch_size) {
            const sku_batch = skus.slice(i, i + batch_size);
            batches.push(
                get_product_skus_query(magento_data?.store?.value, sku_batch)
            );
        }

        const results = await Promise.all(
            batches.map((query) => search(query))
        );

        const products = results.flatMap((result) =>
            result?.hits?.hits?.map((x) => x?._source?.product).filter(Boolean)
        );

        if (!Array.isArray(products)) {
            return returnJSON([], 400);
        }

        return returnJSON(products);
    },
};
