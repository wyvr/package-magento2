import { Config } from '@wyvr/generator/src/utils/config.js';
import { load_data } from '@src/shop/core/elasticsearch.mjs';
import { set } from '@src/magento2/database/navigation.js';
import { Logger } from '@wyvr/generator/src/utils/logger.js';
import { url_join } from '@src/shop/core/url.mjs';

export async function category_index_update() {
    const stores = Config.get('shop.stores');
    const root_categories = Config.get('magento2.category.root');
    const slug = Config.get('shop.slug.category', 'category');

    await Promise.all(
        Object.entries(stores).map(async ([store_name, store_id]) => {
            const root_category = typeof root_categories === 'string' ? root_categories : root_categories[store_name];
            const category_data = await load_data(`wyvr_category_${store_id}`, undefined, 1000);
            //console.log(store_id, category_data);
            const list = category_data.map((entry) => {
                // remove products
                delete entry.category.products;
                return entry.category;
            });
            let index = build_index(list, store_name, store_id, slug, root_category);
            // store raw navigation
            set(store_id + '_index', index);

            return undefined;
        })
    );
}

export function build_index(list, store_name, store_id, slug, root_category) {
    const index = {};
    let cats_to_remove = [];
    const prefixes = Config.get('magento2.elasticsearch.category_url_prefix');
    const prefix = prefixes[store_id] || '';

    list.forEach((category) => {
        // add url
        if (category.url_path) {
            category.url = url_join(store_name, slug, category.url_path.replace(prefix, ''));
        } else {
            return;
        }
        // remove unused properties
        delete category.url_key;
        delete category.children_count;
        delete category.children;
        // ignore root category and all categories before it
        category.path = category.path.split('/').filter(Boolean);
        if (category.entity_id == root_category) {
            cats_to_remove.push(...category.path);
            // remove all categories before it
            category.path.forEach((id) => {
                delete index[id];
            });
            return;
        }
        index[category.entity_id] = category;
    });
    // remove the root_categories from the category path
    if (cats_to_remove.length > 0) {
        cats_to_remove = cats_to_remove.filter((cur, index, arr) => arr.indexOf(cur) == index);
        Object.keys(index).forEach((id) => {
            index[id].path = index[id].path.filter((id) => cats_to_remove.indexOf(id) == -1);
        });
    }

    return index;
}
