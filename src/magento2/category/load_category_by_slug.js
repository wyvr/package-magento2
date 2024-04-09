import { get_config } from '@wyvr/generator/cron.js';
import { load_data } from '@src/shop/core/elasticsearch.mjs';

export async function load_category_by_slug(slug, store_id) {
    if (!slug || store_id === undefined) {
        return [`missing store or slug '${slug}'`, undefined];
    }
    const category_url_prefix = get_config('magento2.elasticsearch.category_url_prefix', {});
    const url = category_url_prefix[store_id] ? `${category_url_prefix[store_id]}/${slug}` : slug;

    const category_data = await load_data(`wyvr_category_${store_id}`, { url });
    if (!category_data) {
        return [`no category data found for ${url}`, undefined];
    }
    if (Array.isArray(category_data) && category_data.length > 0 && category_data[0].category) {
        return [undefined, category_data[0].category];
    }
    return [`invalid category data found for ${url}`, undefined];
}
