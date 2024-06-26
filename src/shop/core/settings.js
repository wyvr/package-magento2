import { logger, get_error_message } from '@wyvr/generator/universal.js';
import { search_segment } from '@wyvr/generator/src/utils/segment.js';
import { load_data } from '@src/shop/core/elasticsearch.js';

const cache = {};

async function load(store, source) {
    if (cache[store]) {
        return cache[store];
    }
    if (store === undefined) {
        return undefined;
    }
    try {
        const data = await load_data('wyvr_settings', { id: store });
        if (!data) {
            return undefined;
        }
        const result = data[0]?.value;
        if (result) {
            cache[store] = result;
            return result;
        }
    } catch (err) {
        logger.error(get_error_message(err, source, `settings store ${store}`));
    }
    return undefined;
}

export async function get(store, segment, source, fallback) {
    const data = await load(store, source);
    if (!segment || typeof segment !== 'string') {
        return fallback;
    }
    return search_segment(data, segment.replace(/\//g, '.'), fallback);
}
