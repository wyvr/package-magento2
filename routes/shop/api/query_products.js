import { Config } from '@wyvr/generator/src/utils/config.js';
import { get_magento_data } from '@src/magento2/core/data.js';
import { get_catalog_products_query } from '@src/shop/core/search/product.js';
import { search } from '@src/shop/core/elasticsearch.js';
import {
    get_attribute_value,
    reduce_attributes,
} from '@src/shop/core/attributes.js';
import { get_time_stamp_minutes } from '@src/shop/core/cache_breaker.js';
import { get_cache, set_cache } from '@src/shop/core/cache.js';
import category_product_attributes from '@src/shop/config/category_product_attributes.js';
import { validate_store } from '@src/shop/core/validate_store.js';

export default {
    url: '/[store]/api/query_products/',
    _wyvr: () => {
        return {
            methods: ['get'],
        };
    },
    onExec: async ({ params, query, returnJSON, data, isProd }) => {
        if (!validate_store(params?.store)) {
            return returnJSON({}, 404);
        }
        const timestamp = get_time_stamp_minutes();

        let amount = 10;
        try {
            amount = JSON.parse(query.amount);
        } catch (err) {}
        // limit the amount
        if (amount > 100) {
            amount = 100;
        }
        if (amount < 1) {
            amount = 0;
        }
        // try extracting conditions
        let conditions = null;
        try {
            conditions = JSON.parse(query.conditions);
        } catch (err) {
            console.error('error converting condition', query.conditions, err);
        }

        if (isProd) {
            const cache_key = `${
                data.url
            }|amount=${amount}|conditions=${JSON.stringify(conditions)}`;
            const cache = get_cache(cache_key);
            if (cache && cache.created >= timestamp) {
                return returnJSON(cache);
            }
        }

        const magento_data = await get_magento_data(data.url);
        // to increase the cache lifetime add minutes to the timestamp
        magento_data.created = timestamp + 5; // cache for ~5min
        magento_data.amount = amount;
        magento_data.conditions = conditions;

        // remove some data
        magento_data.stores = undefined;
        if (!conditions) {
            return returnJSON(magento_data);
        }

        // load from elasticsearch
        const search_query = get_catalog_products_query(
            magento_data?.store?.value
        );
        const result = await search(search_query);
        const all_products = (result?.hits?.hits || []).map(
            (x) => x?._source?.product
        );
        const filtered_products = all_products
            .filter((p) => {
                return conditions.every((c) => {
                    if (c.attribute) {
                        const value = get_attribute_value(p, c.attribute);
                        return c.operator === '==' || c.operator === undefined
                            ? value === c.value
                            : value !== c.value;
                    }
                });
            })
            .sort(
                (a, b) =>
                    new Date(b?.created_at || 0).getTime() -
                    new Date(a?.created_at || 0).getTime()
            );

        const allowed_attributes = Config.get('shop.attributes.slider.allow');
        const denied_attributes = Config.get('shop.attributes.slider.deny');

        magento_data.products = filtered_products
            .slice(0, amount)
            .map((p) => reduce_attributes(p, category_product_attributes));

        if (isProd) {
            set_cache(cache_key, magento_data);
        }

        return returnJSON(magento_data);
    },
};
