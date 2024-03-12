import { get_magento_data } from '@src/magento2/core/data.mjs';
import { search } from '@src/shop/core/elasticsearch.mjs';
import { get_product_skus_query } from '@src/shop/core/search/product.mjs';

/**
 * @WARN uncacheable entpoint
 */

export default {
    url: '/[store]/api/product/get/',
    _wyvr: () => {
        return {
            methods: ['post']
        };
    },
    onExec: async ({ data, body, returnJSON }) => {
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

        const query = get_product_skus_query(magento_data?.store?.value, skus);

        const result = await search(query);

        const products = result?.hits?.hits?.map((x) => x?._source?.product).filter(Boolean);

        if (!Array.isArray(products)) {
            return returnJSON([], 400);
        }

        return returnJSON(products);
    }
};
