import { execute_route, execute_page, get_logger, get_config } from '@wyvr/generator/cron.js';
import { read, write, remove, read_json, to_index } from '@wyvr/generator/src/utils/file.js';
import { filled_string, filled_array } from '@wyvr/generator/src/utils/validate.js';
import { del, get_client, exists_index, clear_index } from '@src/shop/core/elasticsearch.mjs';
import { uniq_values } from '@wyvr/generator/src/utils/uniq.js';
import { ReleasePath } from '@wyvr/generator/src/vars/release_path.js';
import { Cwd } from '@wyvr/generator/src/vars/cwd.js';
import { url_join } from '@src/shop/core/url.mjs';
import { WorkerController } from '@wyvr/generator/src/worker/controller.js';
import { join } from 'path';

export const index = 'wyvr_clear';

export async function set_clear_marker() {
    const doc = { scope: '*', id: '*', type: 'clear' };
    const base = { id: '*', index };
    const client = get_client();
    const exists = await client.exists(base);
    if (!exists) {
        base.document = doc;
        await client.create(base);
    }
}

/**
 * Clear all urls that are known to be generated
 * WARNING: this method only works in an cronjob
 * @param {string} index elasticsearch index name
 * @returns {void}
 */
export async function clear_all_urls(index) {
    if (!filled_string(index)) {
        get_logger().error('no elasticsearch index was provided');
        return;
    }
    const routes_persisted_path = Cwd.get('cache', 'routes_persisted.txt');
    const routes_persisted_total_path = Cwd.get('cache', 'routes_persisted_total.txt');

    const routes = read(routes_persisted_path)?.split('\n') || [];
    // remove all generated routes when the generation should be cleared
    remove(routes_persisted_path);
    const prev_routes = read(routes_persisted_total_path)?.split('\n') || [];
    const total_routes = uniq_values(prev_routes.concat(routes)).filter(Boolean);
    write(routes_persisted_total_path, total_routes.join('\n'));

    const pages = read_json(Cwd.get('cache', 'page_cache.json'))
        ?.map((page) => to_index(page.urls.find(Boolean)))
        .filter(Boolean);
    // delete the whole index as soon as possible
    const index_exists = await exists_index(index);
    if (index_exists) {
        await clear_index(index);
    }
    get_logger().warning('clear whole cache');
    if (total_routes && total_routes.length > 0) {
        get_logger().info('clear', total_routes.length, 'generated routes');
        total_routes.forEach((file) => {
            remove(url_join(ReleasePath.get(), file));
        });
    } else {
        get_logger().info('no routes to clear');
    }

    // rebuild pages
    if (pages && pages.length > 0) {
        get_logger().info('generate', pages.length, 'pages');
        get_logger().debug('page urls', pages);
        for (const url of pages) {
            await execute_page(url);
        }
    } else {
        get_logger().info('no pages to rebuild');
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
    
    const stores = get_config('shop.stores', {});
    const slug = get_config('shop.slug');
    const prefixes = get_config('magento2.elasticsearch.category_url_prefix');
    
    // build url of the entry
    const upsert_urls = [];
    data_docs.forEach((hit) => {
        Object.entries(stores).forEach(([store_name, store_id]) => {
            const prefix = prefixes[store_id] || '';
            // remove the prefix for categories
            const partial_url = prefix && hit._source.scope == 'category' ? hit._source.id.replace(prefix + '/', '') : hit._source.id;
            const url = to_index(url_join(store_name, slug[hit._source.scope], partial_url));

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

export async function generate_routes(urls) {
    if (urls && urls.length > 0) {
        const domain = 'https://' + get_config('url');
        const chunk_size = Math.round(WorkerController.get_cpu_cores() / 3);
        const chunks = get_chunks(urls, chunk_size);
        const release_path = ReleasePath.get();
        // process urls in chunks
        get_logger().info('generate', urls.length, 'routes');
        for (let i = 0, len = chunks.length; i < len; i++) {
            get_logger().info('generate chunk', i + 1, 'of', len);
            const chunk = chunks[i];
            await Promise.all(
                chunk.map(async (url) => {
                    // delete before the route is requested
                    remove(join(release_path, url));
                    const [error, ok] = await trigger_url(url_join(domain, url));
                    if(error) {
                        get_logger().error('error triggering', url, error);
                    }
                    return ok;
                })
            );
        }
        get_logger().info('done', urls.length, 'routes');
    }
}

export async function trigger_url(url) {
    try {
        const response = await fetch(url, {
            cache: 'no-cache',
        });

        return [undefined, response.ok];
    } catch (e) {
        return [e, false];
    }
}

export function get_chunks(array, chunk_size = 10) {
    const chunks = [];
    if (!Array.isArray(array)) {
        return chunks;
    }
    for (let i = 0, len = array.length; i < len; i += chunk_size) {
        chunks.push(array.slice(i, i + chunk_size));
    }
    return chunks;
}