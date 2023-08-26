import { Config } from '@wyvr/generator/src/utils/config.js';
import { get_magento_data } from '@src/shop/core/data.mjs';
import { get_catalog_products_query } from '@src/shop/core/search/product.mjs';
import { search } from '@src/shop/core/elasticsearch.mjs';
import { reduce_attributes } from '@src/shop/core/attributes.mjs';
import { get_time_stamp_minutes } from '@src/shop/core/cache_breaker.mjs';
import { get_cache, set_cache } from '@src/shop/core/cache.mjs';

export default {
    url: '/[store]/api/newest_products/[flag]/[amount]/',
    _wyvr: () => {
        return {
            methods: ['get'],
        };
    },
    onExec: async ({ params, returnJSON, data, isProd }) => {
        const timestamp = get_time_stamp_minutes();

        if (isProd) {
            const cache = get_cache(data.url);
            if (cache && cache.created >= timestamp) {
                return returnJSON(cache);
            }
        }

        const magento_data = await get_magento_data(data.url);
        // to increase the cache lifetime add minutes to the timestamp
        magento_data.created = timestamp + 5; // cache for ~5min

        let amount = 10;
        try {
            amount = JSON.parse(params.amount);
        } catch (err) {}
        // limit the amount
        if (amount > 100) {
            amount = 100;
        }
        if (amount < 1) {
            amount = 0;
        }
        magento_data.amount = amount;
        magento_data.flag = params.flag;

        // remove some data
        delete magento_data.stores;

        // load from elasticsearch
        const query = get_catalog_products_query(magento_data?.store?.value, amount, undefined, [
            {
                created_at: {
                    order: 'desc',
                },
            },
        ]);

        // cache the results because 90% of this request is the elastic search request
        const result = await search(query);

        const all_products = (result?.hits?.hits || []).map((x) => x?._source?.product);

        let sorted_products = all_products.sort(
            (a, b) => new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime()
        );
        // show only products with the attribute new activated
        if (params.flag == 'new') {
            sorted_products = sorted_products.filter((p) => p.new && p.new != '0');
        }

        const allowed_attributes = Config.get('magento2.attributes.slider.allow');
        const denied_attributes = Config.get('magento2.attributes.slider.deny');

        magento_data.products = sorted_products
            .slice(0, amount)
            .map((p) => reduce_attributes(p, allowed_attributes, denied_attributes));

        if (isProd) {
            set_cache(data.url, magento_data);
        }

        return returnJSON(magento_data);
    },
};
