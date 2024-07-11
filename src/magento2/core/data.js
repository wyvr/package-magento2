import { Config } from '@wyvr/generator/src/utils/config.js';
import { get } from '@src/shop/core/settings.js';
import { replace_content } from '@src/magento2/core/replace_content.js';
import { load_data } from '@src/shop/core/elasticsearch.js';

const locale_cache = {};
const currency_cache = {};

export async function get_magento_data(url) {
    const data = {
        date: new Date(),
    };
    if (typeof url !== 'string' || url.length === 0) {
        return data;
    }
    const message = `magento 2 plugin ${url}`;
    const store_key = get_store_key(url);
    const store_data = get_store_data(store_key);

    for (const key of Object.keys(store_data)) {
        data[key] = store_data[key];
    }

    if (!store_key) {
        return data;
    }

    const store_id = store_data?.store?.value || undefined;
    if (!store_id) {
        return data;
    }

    // try load locale from cache
    if (!locale_cache[store_id]) {
        const code = await get(
            store_id,
            'general.locale.code',
            message,
            'en_US'
        );
        locale_cache[store_id] = code.split('_')[0];
    }
    data.locale = locale_cache[store_id];

    // try load currency from cache
    if (!currency_cache[store_id]) {
        currency_cache[store_id] = await get(
            store_id,
            'currency.options.default',
            message,
            'EUR'
        );
    }
    data.currency = currency_cache[store_id];
    return data;
}
export function get_store_key(url) {
    const store_match = url.match(/^\/([^\/]+)\//);
    if (store_match?.[1]) {
        return store_match[1];
    }
    return undefined;
}
export function get_store_data(store_key) {
    const stores = Config.get('shop.stores');
    const result = { stores };
    const store_keys = Object.keys(stores);

    if (store_key && store_keys.find((key) => key === store_key)) {
        result.store = {
            key: store_key,
            value: stores[store_key],
        };
    } else {
        // fallback to first store
        const first_key = Object.keys(stores).find((x) => x);
        result.store = {
            key: first_key,
            value: stores[first_key],
        };
    }

    return result;
}
export async function get_page_by_url(store_id, route) {
    const data = {};
    const page_data = await load_data(`wyvr_page_${store_id}`, { url: route });
    if (
        !Array.isArray(page_data) ||
        page_data.length === 0 ||
        !page_data[0].page
    ) {
        return data;
    }
    await Promise.all(
        Object.keys(page_data[0].page).map(async (key) => {
            if (key === 'content') {
                data[key] = await replace_content(
                    page_data[0].page[key],
                    store_id
                );
                return undefined;
            }
            data[key] = page_data[0].page[key];
            return undefined;
        })
    );
    return data;
}
