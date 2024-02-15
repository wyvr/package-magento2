import { get_magento_data } from '@src/magento2/core/data.mjs';
import { search } from '@src/shop/core/elasticsearch.mjs';
import { get_product_sku_query } from '@src/shop/core/search/product.mjs';

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

        const queries = body
            .map((sku) => {
                if (typeof sku !== 'string') {
                    return undefined;
                }
                return get_product_sku_query(magento_data?.store?.value, sku);
            })
            .filter(Boolean);

        // a maximum of 25 products can be loaded
        const results = await Promise.all(
            queries.slice(0, 25).map(async (query) => {
                const result = await search(query);
                const product = result?.hits?.hits?.find((x) => x?._source?.product)?._source?.product;
                return product;
            })
        );
        const products = results.filter(Boolean);
        if (!Array.isArray(products)) {
            return returnJSON([], 400);
        }

        return returnJSON(products);
    }
};
