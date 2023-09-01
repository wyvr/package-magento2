import { Config } from '@wyvr/generator/src/utils/config.js';
import { load_data } from '@src/shop/core/elasticsearch.mjs';
import { Logger } from '@wyvr/generator/src/utils/logger.js';
import { onExec, _wyvr } from '@src/shop/core/not_found.mjs';
import category_product_attributes from '@src/shop/config/category_product_attributes.mjs';
import { reduce_attributes } from '@src/shop/core/attributes.mjs';

const slug = Config.get('shop.slug.category', 'category');
export default {
    url: `/[store]/${slug}/[slug]`,
    onExec: async ({ request, params, data, setStatus }) => {
        if (!data?.store?.value) {
            Logger.warning('missing store id in category', data.url);
            return data;
        }
        let start = new Date().getTime();
        const store_id = data.store.value;

        const category_url_prefix = Config.get('magento2.elasticsearch.category_url_prefix', {});
        const url = category_url_prefix[store_id] ? `${category_url_prefix[store_id]}/${params.slug}` : params.slug;

        const category_data = await load_data(`wyvr_category_${store_id}`, { url });
        if (!category_data) {
            return await onExec({ data, setStatus });
        }
        let category;
        if (Array.isArray(category_data) && category_data.length > 0 && category_data[0].category) {
            category = category_data[0].category;
        } else {
            Logger.error('category convert error', request.url, category_data);
        }

        if (!category) {
            return await onExec({ data, setStatus });
        }

        data.timing = { category: new Date().getTime() - start };

        start = new Date().getTime();
        const index_name = `wyvr_cache_${store_id}`;

        const cache_data = await load_data(index_name, { id: category.entity_id });

        data.timing.products = new Date().getTime() - start;
        start = new Date().getTime();

        category.products = [];
        const allowed_attributes = Config.get('shop.attributes.list.allow');
        const denied_attributes = Config.get('shop.attributes.list.deny');

        if (Array.isArray(cache_data) && cache_data.length > 0) {
            category.products = cache_data[0].products.map((product_data) => {
                const product = {};
                Object.keys(product_data)
                    .filter((key) => category_product_attributes.indexOf(key) > -1)
                    .forEach((key) => {
                        if (key == 'configurable_products') {
                            const child_products = product_data[key]
                                .map((child_product) => {
                                    const product = {};
                                    Object.keys(child_product)
                                        .filter((key) => category_product_attributes.indexOf(key) > -1)
                                        .forEach((key) => {
                                            product[key] = child_product[key];
                                        });
                                    return product;
                                })
                                .filter((x) => x);

                            product[key] = child_products;
                            return;
                        }
                        product[key] = product_data[key];
                    });
                return reduce_attributes(product, allowed_attributes, denied_attributes);
            });
        }

        data.category = category;
        data.timing.assign = new Date().getTime() - start;

        return data;
    },
    _wyvr: ({ data, params }) => {
        if (!data || !data.category) {
            return _wyvr({ data });
        }
        const result = {
            template: ['shop/Category', 'shop/Default'],
            methods: ['get'],
            persist: true,
            language: data?.locale || 'en',
        };
        if (!data?.category?.entity_id) {
            return result;
        }

        let curPath = [];
        const path = (data.category?.path || '')
            .split('/')
            .map((id) => {
                curPath.push(id);
                return `shop/category/path/${curPath.join('/')}`;
            })
            .reverse();

        result.template = [
            `shop/category/id/${data.category.entity_id}`,
            `shop/category/slug/${params.slug}`,
            ...path,
            ...result.template,
        ];

        return result;
    },
    title: ({ params, data }) => data.category?.name || data?.title || params.slug,
    content: ({ data }) => {
        return data?.content || '';
    },
};
