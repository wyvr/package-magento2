import { execute_route } from '@wyvr/generator/route.js';
import { exists, read, remove } from '@wyvr/generator/src/utils/file.js';
import { Config } from '@wyvr/generator/src/utils/config.js';
import { Logger } from '@wyvr/generator/src/utils/logger.js';
import { get_client, query_data } from '../../src/shop/core/elasticsearch.mjs';
import { join } from 'path';
import { uniq_values } from '@wyvr/generator/src/utils/uniq.js';
import { ReleasePath } from '@wyvr/generator/src/vars/release_path.js';

export default async function () {
    const client = get_client();
    const stores = Config.get('shop.stores');

    try {
        await client.ping();
    } catch (err) {
        Logger.error('elasticsearch error:', err.message);
        return;
    }
    const marker = Config.get('magento2.marker');
    if (!marker?.dir) {
        Logger.error('marker dir is not set');
        return;
    }
    if (!exists(marker.dir)) {
        Logger.error('marker dir does not exist', marker?.dir); // DDEV is not able to break outside the docker
        return;
    }

    const files = Object.keys(stores)
        .map((store) => {
            const id = stores[store];
            const actions = ['update', 'delete'];
            const types = ['product', 'category'];

            return types.map((type) => {
                return actions.map((action) => {
                    const path = join(marker.dir, `wyvr_${type}_${id}-${action}`);
                    if (!exists(path)) {
                        return undefined;
                    }
                    return {
                        path,
                        type,
                        action,
                        store_id: id,
                        store_name: store,
                        index: `wyvr_${type}_${id}`,
                    };
                });
            });
        })
        .flat(2)
        .filter((x) => x);

    if (files.length == 0) {
        return;
    }

    await Promise.all(
        files.map(async (file) => {
            const entries = get_content(file.path).filter((x) => x);
            const query = {
                terms: {
                    _id: entries,
                },
            };
            // console.log(JSON.stringify(query, null, 4));

            const data = await query_data(file.index, query);

            let get_url = (url) => {
                return join(file.store_name, url);
            };
            switch (file.type) {
                case 'product':
                    get_url = (url) => {
                        return `/${join(file.store_name, 'p', url)}/`;
                    };
                    break;
                case 'category':
                    get_url = (url) => {
                        return `/${join(file.store_name, 'c', url)}/`;
                    };
                    break;
            }

            switch (file.action) {
                case 'update':
                    await Promise.all(
                        data.map(async (entry) => {
                            const url = get_url(entry.url);
                            Logger.info('build', url);
                            return await execute_route(url);
                        })
                    );
                    break;
                case 'delete':
                    await Promise.all(
                        data.map(async (entry) => {
                            const url = get_url(entry.url);
                            Logger.info('remove', url);
                            remove(join(ReleasePath.get(), url));
                            return undefined;
                        })
                    );
                    break;
            }

            return undefined;
            // await process_file(Cwd.get(FOLDER_CACHE, `magento2_process_product_${id}_edit`), async (list) => {
            //     await Promise.all(
            //         list
            //             .filter((x) => x)
            //             .map(async (url) => {
            //                 const path = `/${store}/p/${url}`;
            //                 Logger.info('build', `/${store}/p/${url}/`)
            //                 return await exec(path);
            //             })
            //     );
            // });
        })
    );
}

function get_content(file) {
    if (!exists(file)) {
        return [];
    }
    const content = read(file);

    // clear the file
    //write(file, '');

    if (!content) {
        return [];
    }

    return uniq_values(content.split('\n'));
}
