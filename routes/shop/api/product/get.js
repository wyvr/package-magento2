import { get_cache, set_cache } from '@src/shop/core/cache.mjs';
import { get_time_stamp_minutes } from '@src/shop/core/cache_breaker.mjs';
import { get_magento_data } from '@src/magento2/core/data.mjs';
import { search } from '@src/shop/core/elasticsearch.mjs';
import { get_product_sku_query } from '@src/shop/core/search/product.mjs';

export default {
    url: '/[store]/api/product/get/[sku]',
    _wyvr: () => {
        return {
            methods: ['get']
        };
    },
    onExec: async ({ params, data, returnJSON, isProd }) => {
        const timestamp = get_time_stamp_minutes();

        if (isProd) {
            const cache = get_cache(data.url);
            if (cache && cache.created > timestamp) {
                return returnJSON(cache.product);
            }
        }

        const magento_data = await get_magento_data(data.url);
        // to increase the cache lifetime add minutes to the timestamp
        magento_data.created = timestamp + 1; // cache for ~1min

        const query = get_product_sku_query(magento_data?.store?.value, params.sku);

        const result = await search(query);

        if (!result?.hits?.hits) {
            return returnJSON(undefined, 400);
        }

        const product = result.hits.hits.find((x) => x?._source?.product);
        if (!product) {
            return returnJSON(undefined, 404);
        }
        if (isProd) {
            set_cache(data.url, {
                created: magento_data.created,
                product: product._source.product
            });
        }
        return returnJSON(product._source.product);
    }
};
