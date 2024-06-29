import { load_data } from '@src/shop/core/elasticsearch.js';
import { transform_elasticsearch_products } from '@src/magento2/core/transform_elasticsearch_products.js';
import { get_error_message } from '@wyvr/generator/universal.js';

export async function load_category_products(id, store_id) {
    if (!id || store_id === undefined) {
        return [`missing store or id '${id}'`, undefined];
    }
    const index_name = `wyvr_cache_${store_id}`;

    const cache_data = await load_data(index_name, { id });

    if (!Array.isArray(cache_data) || cache_data.length === 0) {
        return [`no products in category ${id}'`, undefined];
    }
    try {
        return [undefined, transform_elasticsearch_products(cache_data[0].products)];
    } catch (e) {
        return [get_error_message(e, import.meta.url, 'load category product'), undefined];
    }
}
