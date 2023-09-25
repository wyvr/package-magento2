import { execute_route, execute_page, get_logger, get_config } from '@wyvr/generator/cron.js';
import { exists, read, remove, read_json, to_index } from '@wyvr/generator/src/utils/file.js';
import { del, del_index, exists_index, get_client, query_data, search } from '../../src/shop/core/elasticsearch.mjs';
import { uniq_values } from '@wyvr/generator/src/utils/uniq.js';
import { ReleasePath } from '@wyvr/generator/src/vars/release_path.js';
import { Cwd } from '@wyvr/generator/src/vars/cwd.js';
import { url_join } from '@src/shop/core/url.mjs';

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
        get_logger().error('elasticsearch error:', err.message);
        return;
    }

    const index = 'wyvr_clear';

    if (!(await exists_index(index))) {
        get_logger().warning(`index ${index} does not exist`);
        return;
    }

    // global cache clearer
    const cache_clear = await search({
        index,
        query: {
            match: { type: { query: 'clear' } },
        },
        size: 1,
    });

    const routes = uniq_values(read(Cwd.get('cache', 'routes_persisted.txt'))?.split('\n').filter(Boolean));
    const pages = read_json(Cwd.get('cache', 'page_cache.json'))
        ?.map((page) => to_index(page.urls.find(Boolean)))
        .filter(Boolean);

    if (cache_clear?.hits?.hits.length > 0) {
        // delete the whole index as soon as possible
        await del_index(index);

        get_logger().warning('clear whole cache, this can take up some time');

        if (pages && pages.length > 0) {
            get_logger().info('generate', pages.length, 'pages');
            get_logger().debug('page urls', pages);
            await Promise.all(
                pages.map(async (url) => {
                    return await execute_page(url);
                })
            );
        }
        await generate_routes(routes);
        return;
    }

    const data = await search({
        index,
        query: {
            match_all: {},
        },
        size: 25,
    });

    /**
     * @type {WyvrClearDoc[]|null} data_docs
     */
    const data_docs = data?.hits?.hits;
    if (data_docs.length > 0) {
        // delete the docs as soon as possible
        await Promise.all(data_docs.map(async (hit) => await del(index, hit._id)));
        const stores = Object.keys(get_config('shop.stores', {}));
        const slug = get_config('shop.slug');

        // build url of the entry
        const upsert_urls = [];
        data_docs.forEach((hit) => {
            stores.forEach((store) => {
                const url = to_index(url_join(store, slug[hit._source.scope], hit._source.id));
                if (hit._source.type == 'delete') {
                    // delete the generated file directly
                    remove(url_join(ReleasePath.get(), url));
                } else {
                    upsert_urls.push(url);
                }
            });
        });

        await generate_routes(upsert_urls);
    }
}

async function generate_routes(urls) {
    if (urls && urls.length > 0) {
        get_logger().info('generate', urls.length, 'routes');
        get_logger().info('route urls', urls);

        await Promise.all(
            urls.map(async (url) => {
                return await execute_route(url);
            })
        );
    }
}
