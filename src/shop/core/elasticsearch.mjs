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
            size
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

export async function query_data(index, query, size) {
    const data = {
        index,
        query,
    };
    if (size && typeof size == 'number') {
        data.size = size;
    }
    const result = await search(data);
    if (!result) {
        return undefined;
    }
    if (Array.isArray(result?.hits?.hits)) {
        try {
            return result?.hits?.hits.map((x) => x._source);
        } catch (e) {
            Logger.error(term, get_error_message(e, import.meta.url, 'magento2 elasticsearch'));
            return undefined;
        }
    }
    return undefined;
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
