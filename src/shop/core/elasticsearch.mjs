import { Client } from '@elastic/elasticsearch';
import { Config } from '@wyvr/generator/src/utils/config.js';
import { logger, get_error_message } from '@wyvr/generator/universal.js';
import { filled_object } from '@wyvr/generator/src/utils/validate.js';

let client;

export async function load_data(index, match, size, filter_fn) {
    if (!filled_object(match)) {
        return await query_data(
            index,
            {
                match_all: {}
            },
            size,
            { scroll: '20s' },
            filter_fn
        );
    }
    return await query_data(
        index,
        {
            match
        },
        size,
        undefined,
        filter_fn
    );
}

export async function query_data(index, query, size, options, filter_fn) {
    const data = {
        index,
        query
    };
    let filter_function = () => true;
    if (typeof filter_fn === 'function') {
        filter_function = filter_fn;
    }
    if (size && typeof size === 'number') {
        data.size = size;
    }
    data.rest_total_hits_as_int = true;
    if (options) {
        for (const [key, value] of Object.entries(options)) {
            data[key] = value;
        }
    }
    const result = await search(data);
    if (!result) {
        return undefined;
    }
    let hits = undefined;
    if (Array.isArray(result?.hits?.hits)) {
        try {
            hits = result?.hits?.hits.map((x) => x._source).filter(filter_function);
        } catch (e) {
            logger.error(query, get_error_message(e, import.meta.url, 'magento2 elasticsearch'));
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
        // @SEE https://stackoverflow.com/questions/63216861/elasticsearch-scroll-api-returns-terminated-early-without-scroll-id
        const scroll_result = await get_client().scroll({
            scroll_id,
            scroll: options?.scroll ?? '20s',
            rest_total_hits_as_int: true
        });
        if (!scroll_result) {
            logger.error('magento2 elasticsearch scroll returned no result');
            return hits;
        }
        if (!scroll_result._scroll_id || !Array.isArray(scroll_result?.hits?.hits)) {
            logger.error(
                `magento2 elasticsearch scroll ended early ${hits.length} of ${total} loaded only ~${Math.round((100 / total) * hits.length)}% terminated:${
                    scroll_result.terminated_early
                }`
            );
            return hits;
        }
        // filter search results as early as possible
        hits = hits.concat(scroll_result?.hits?.hits.map((x) => x._source).filter(filter_function));

        // avoid scrolling when no results gets returned
        if (scroll_result?.hits?.hits?.length === 0) {
            scroll_id = undefined;
        }
    }

    return hits;
}

export async function exists_index(index) {
    const data = { index };
    try {
        const result = await get_client().indices.exists(data);
        return result;
    } catch (e) {
        return false;
    }
}

export async function search(data) {
    try {
        const result = await get_client().search(data);
        return result;
    } catch (e) {
        logger.error('error', get_error_message(e, import.meta.url, 'magento2 elasticsearch'), JSON.stringify(data));
        return undefined;
    }
}

export async function create_index(index, mapping) {
    const exists = await exists_index(index);
    if (!exists) {
        logger.info('create index', index);
        await get_client().indices.create({ index, body: { mappings: { properties: mapping } } });
        // $indices = $this->elasticSearchClient->indices();
        // $indices->create(['index' => $indexName, 'body' => ['mappings' => ['properties' => $mapping]]]);
    }
    return exists;
}

export async function count_index(index) {
    try {
        const count_response = await get_client().count({ index });
        return count_response?.count ?? 0;
    } catch (e) {
        return 0;
    }
}

export async function del(index, id) {
    const data = { id, index };
    try {
        await get_client().delete(data);
        return true;
    } catch (e) {
        logger.error('error', get_error_message(e, import.meta.url, 'magento2 elasticsearch'), JSON.stringify(data));
        return false;
    }
}

export async function del_index(index) {
    const data = { index };
    try {
        await get_client().indices.delete(data);
        return true;
    } catch (e) {
        logger.error('error', get_error_message(e, import.meta.url, 'magento2 elasticsearch'), JSON.stringify(data));
        return false;
    }
}

export async function clear_index(index) {
    try {
        await get_client().deleteByQuery({
            index,
            query: {
                match_all: {}
            }
        });
        return true;
    } catch (e) {
        logger.error('error', get_error_message(e, import.meta.url, 'magento2 elasticsearch'), JSON.stringify(data));
        return false;
    }
}

export function get_client() {
    if (client) {
        return client;
    }
    const elasticsearch = Config.get('magento2.elasticsearch', {
        node: 'http://localhost:9200'
    });
    client = new Client({
        node: elasticsearch.node,
        auth: elasticsearch.auth
    });
    return client;
}
