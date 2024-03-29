import { get_config } from '@wyvr/generator/cron.js';
import { logger } from '@wyvr/generator/universal.js';
import { exists_index, get_client, search } from '@src/shop/core/elasticsearch.mjs';
import { clear_all_urls, clear_urls, index } from '@src/magento2/core/clear_caches.js';

/**
 * The Elasticsearch response object for the wyvr_clear docs
 * @typedef {Object} WyvrClearDoc
 *
 * @property {string} _index - The name of the index.
 * @property {string} _type - The type of the document.
 * @property {string} _id - The unique identifier of the document.
 * @property {number} _score - The relevance score of the result.
 * @property {Object} _source - The source document that was indexed.
 * @property {string} _source.scope - The scope of the document.
 * @property {string} _source.id - The identifier of the document within its scope.
 * @property {string} _source.type - The operation type on the document.
 */

export default async function () {
    const client = get_client();
    let domain = get_config('url');
    if (domain) {
        domain = `https://${domain}`;
    }

    try {
        await client.ping();
    } catch (err) {
        logger.error('elasticsearch error:', err.message);
        return;
    }

    if (!(await exists_index(index))) {
        logger.warning(`index ${index} does not exist`);
        return;
    }

    // global cache clearer
    const cache_clear = await search({
        index,
        query: {
            match: { type: { query: 'clear' } }
        },
        size: 1
    });

    // clear all known pages
    if (cache_clear?.hits?.hits.length > 0) {
        await clear_all_urls(index);
        return;
    }

    const default_size = 25;
    let size = Number.parseInt(get_config('magento2.cache.regenerate_size', default_size), 10);
    if (Number.isNaN(size)) {
        size = default_size;
    }

    // search for pages which should be regenerated
    const data = await search({
        index,
        query: {
            match_all: {}
        },
        size
    });

    /**
     * @type {WyvrClearDoc[]|null} data_docs
     */
    const data_docs = data?.hits?.hits;
    if (data_docs.length > 0) {
        await clear_urls(index, data_docs);
    }
}
