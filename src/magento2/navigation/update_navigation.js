import { Config } from '@wyvr/generator/src/utils/config.js';
import { Logger } from '@wyvr/generator/src/utils/logger.js';
import { set } from '@src/magento2/database/navigation.js';
import { load_data } from '@src/shop/core/elasticsearch.mjs';

export async function update_navigation() {
    const stores = Config.get('shop.stores');
    const slug = Config.get('shop.slug.category', 'category');

    await Promise.all(
        Object.entries(stores).map(async ([store_name, store_id]) => {
            const category_data = await load_data(`wyvr_category_${store_id}`, undefined, 1000);
            //console.log(store_id, category_data);
            const list = category_data.map((entry) => {
                // remove products
                delete entry.category.products;
                return entry.category;
            });
            let tree = build_tree(list, store_name, slug);
            // store raw navigation
            set(store_id + '_full', tree);

            // avoid navigation with only one category in the first level
            if (tree.length <= 1) {
                tree = tree[0].children;
            }
            // avoid navigation deeper than configured level
            const max_depth = Config.get('magento2.navigation.max_depth', 4);
            if (!isNaN(max_depth)) {
                tree = apply_max_depth(tree, max_depth);
            }

            // store the processed navigation tree
            set(store_id, tree);

            Logger.info('update magento navigation for store', store_id);

            return undefined;
        })
    );
}

export function build_tree(list, store_name, slug) {
    let map = {};
    // sort by level to avoid adding nodes to not configured parents
    list.sort((a, b) => {
        return b.level - a.level;
    }).forEach((entry) => {
        if (entry.is_active == false) {
            return;
        }
        // add url
        if (entry.url_path) {
            const partial_url = [store_name, slug, entry.url_path]
                .filter(Boolean)
                .map((part) => part.trim())
                .join('/');
            entry.url = `/${partial_url}/`;
        }

        if (!map[entry.parent_id]) {
            map[entry.parent_id] = [];
        }
        // try to convert numbers
        Object.entries(entry).forEach(([key, value]) => {
            if (typeof value != 'string') {
                return;
            }
            const int = parseInt(value, 10);
            if (int == value.trim()) {
                entry[key] = int;
            }
        });
        // has children, then combine them into this element
        if (map[entry.entity_id]) {
            entry.children = map[entry.entity_id].sort((a, b) => a.position - b.position);
            map[entry.entity_id] = entry;
            // delete the entries of the children
            entry.children.forEach((child) => delete map[child.entity_id]);
        }
        map[entry.parent_id].push(entry);
        if (entry.parent_id === 0) {
            delete map[entry.entity_id];
        }
    });
    // find first real category that has children with urls
    const id = Object.keys(map).find((id) => {
        return !Array.isArray(map[id]) && map[id]?.children.length > 0 && map[id]?.children.find((child) => child.url);
    });
    if (id == null) {
        return undefined;
    }
    return map[id]?.children;
}

function apply_max_depth(tree, max_depth) {
    return tree
        .map((node) => {
            if (node.level > max_depth) {
                return null;
            }

            if (Array.isArray(node.children)) {
                node.children = apply_max_depth(node.children, max_depth);
            }

            return node;
        })
        .filter(Boolean);
}
