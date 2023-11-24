import { jsonOptions, magentoUrl, request, authOptions } from '@src/shop/api/api';
import { get_admin_token } from '@src/shop/logic/get_admin_token.mjs';
import { get_logger } from '@wyvr/generator/cron.js';
import { sleep_random } from '@src/shop/api/sleep.js';
import { get_cache, set_cache } from '@src/shop/core/cache.mjs';
import { get_time_stamp_seconds } from '@src/shop/core/cache_breaker.mjs';

export default {
    url: '/[store]/api/product/live/[sku]',
    _wyvr: () => {
        return {
            methods: ['get'],
        };
    },
    onExec: async ({ params, data, returnJSON, isProd }) => {
        const timestamp = get_time_stamp_seconds();
        const cache = get_cache(data.url);
        if (cache && cache.created > timestamp) {
            return returnJSON(cache.updated);
        }
        // to increase the cache lifetime add minutes to the timestamp
        const created = timestamp + 10; // cache for ~10sec

        const admin_token = await get_admin_token(isProd);
        if (!admin_token) {
            Logger.error('magento2 live product, missing admin token');
            await sleep_random(400, 800);
            return returnJSON({ message: __('shop.internal_error') }, 500);
        }

        const requests = [
            {
                prop: 'stock',
                url: magentoUrl(`/rest/all/V1/stockItems/${encodeURIComponent(params.sku)}`),
                fn: (result) => {
                    const { qty = 0, is_in_stock = false } = result;
                    return { qty, is_in_stock };
                },
            },
            {
                prop: 'price',
                url: magentoUrl(`/rest/all/V1/products/base-prices-information`),
                body: { skus: [params.sku] },
                method: 'post',
                fn: getPrice,
            },
            {
                prop: 'special_price',
                url: magentoUrl(`/rest/all/V1/products/special-price-information`),
                body: { skus: [params.sku] },
                method: 'post',
                fn: getPrice,
            },
        ];

        const updated = {};

        const succeeded = await Promise.all(
            requests.map(async (entry) => {
                if (!entry?.url || !entry?.prop) {
                    return false;
                }
                const config = {
                    method: entry?.method || 'GET',
                };
                if (entry.body) {
                    if (entry.body) {
                        config.body = {};
                    }
                    Object.entries(entry.body).forEach(([key, value]) => {
                        config.body[key] = value;
                    });
                }

                try {
                    const result = await request(entry.url, authOptions(admin_token, jsonOptions(config)));
                    if (!result.ok) {
                        get_logger().warning('magento2 product, live request failed', entry.url, result.status, result.statusText);
                        return false;
                    }
                    if (typeof entry?.fn == 'function') {
                        updated[entry.prop] = entry.fn(result.body);
                        return true;
                    }
                    updated[entry.prop] = result.body;
                } catch (e) {
                    get_logger().error('magento2 product, live request error', entry.url, e);
                    return false;
                }
                return true;
            })
        );
        if (!succeeded.find(Boolean)) {
            await sleep_random(100, 200);
            return returnJSON({ message: __('shop.internal_error') }, 500);
        }
        set_cache(data.url, { created, updated });
        return returnJSON(updated);
    },
};

function getPrice(result) {
    if (!Array.isArray(result) || result.length == 0) {
        return undefined;
    }
    return result[0].price;
}
