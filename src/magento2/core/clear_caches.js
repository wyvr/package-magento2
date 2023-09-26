import { execute_route, execute_page, get_logger, get_config } from '@wyvr/generator/cron.js';
import { read, remove, read_json, to_index } from '@wyvr/generator/src/utils/file.js';
import { filled_string, filled_array } from '@wyvr/generator/src/utils/validate.js';
import { del, del_index } from '@src/shop/core/elasticsearch.mjs';
import { uniq_values } from '@wyvr/generator/src/utils/uniq.js';
import { ReleasePath } from '@wyvr/generator/src/vars/release_path.js';
import { Cwd } from '@wyvr/generator/src/vars/cwd.js';
import { url_join } from '@src/shop/core/url.mjs';

export const index = 'wyvr_clear';

/**
 * Clear all urls that are known to be generated
 * @param {string} index elasticsearch index name
 * @returns {void}
 */
export async function clear_all_urls(index) {
    if (!filled_string(index)) {
        get_logger().error('no elasticsearch index was provided');
        return;
    }
    const routes = uniq_values(read(Cwd.get('cache', 'routes_persisted.txt'))?.split('\n').filter(Boolean));
    const pages = read_json(Cwd.get('cache', 'page_cache.json'))
        ?.map((page) => to_index(page.urls.find(Boolean)))
        .filter(Boolean);
    // delete the whole index as soon as possible
    await del_index(index);
    get_logger().warning('clear whole cache');
    // remove all generated routes when the generation should be cleared
    remove(Cwd.get('cache', 'routes_persisted.txt'));

    get_logger().info('clear', routes.length, 'generated routes');
    routes.forEach((file) => {
        remove(url_join(ReleasePath.get(), file));
    });

    // rebuild pages
    if (pages && pages.length > 0) {
        get_logger().info('generate', pages.length, 'pages');
        get_logger().debug('page urls', pages);
        await Promise.all(
            pages.map(async (url) => {
                return await execute_page(url);
            })
        );
    }
}

/**
 *
 * @param {string} index elasticsearch index name
 * @param {import('../../../cron/magento2/clear_caches.mjs').WyvrClearDoc|null} data_docs
 * @returns {void}
 */
export async function clear_urls(index, data_docs) {
    if (!filled_string(index)) {
        get_logger().error('no elasticsearch index was provided');
        return;
    }
    if (!filled_array(data_docs)) {
        get_logger().error('no elasticsearch clear data was provided');
        return;
    }
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
