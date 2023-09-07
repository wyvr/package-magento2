import { Client } from '@elastic/elasticsearch';
import { Config } from '@wyvr/generator/src/utils/config.js';
import { Logger } from '@wyvr/generator/src/utils/logger.js';
import { get_error_message } from '@wyvr/generator/src/utils/error.js';
import { filled_object } from '@wyvr/generator/src/utils/validate.js';

let client;

export async function load_data(index, match, size) {
    if (!filled_object(match)) {
        return await query_data(
            index,
            {
                match_all: {},
            },
            size,
            { scroll: '10s' }
        );
    }
    return await query_data(
        index,
        {
            match,
        },
        size
    );
}

export async function query_data(index, query, size, options) {
    const data = {
        index,
        query,
    };
    if (size && typeof size == 'number') {
        data.size = size;
    }
    data.rest_total_hits_as_int = true;
    if (options) {
        Object.entries(options).forEach(([key, value]) => {
            data[key] = value;
        });
    }
    const result = await search(data);
    if (!result) {
        return undefined;
    }
    let hits = undefined;
    if (Array.isArray(result?.hits?.hits)) {
        try {
            hits = result?.hits?.hits.map((x) => x._source);
        } catch (e) {
            Logger.error(term, get_error_message(e, import.meta.url, 'magento2 elasticsearch'));
        }
    }
    let scroll_id = result._scroll_id;
    if (!scroll_id) {
        return hits;
    }
    const total = result.hits?.total;
    if (!total) {
        return hits;
    }

    while (scroll_id) {
        const scroll_result = await get_client().scroll({ scroll_id, rest_total_hits_as_int: true });
        if (!scroll_result) {
            return hits;
        }
        if (Array.isArray(scroll_result?.hits?.hits)) {
            hits = hits.concat(scroll_result?.hits?.hits.map((x) => x._source));
        }
        if (!scroll_result._scroll_id) {
            return hits;
        }
        if (hits.length >= total) {
            scroll_id = undefined;
        }
    }

    return hits;
}

export async function search(data) {
    try {
        const result = await get_client().search(data);
        return result;
    } catch (e) {
        Logger.error('error', get_error_message(e, import.meta.url, 'magento2 elasticsearch'), JSON.stringify(data));
        return undefined;
    }
}

export function get_client() {
    if (client) {
        return client;
    }
    const elasticsearch = Config.get('magento2.elasticsearch', { node: 'http://localhost:9200' });
    const stores = Config.get('shop.stores', { default: 0 });
    client = new Client({
        node: elasticsearch.node,
        auth: elasticsearch.auth,
    });
    return client;
}
