import { get_config, get_logger } from '@wyvr/generator/cron.js';
import { onExec } from '@src/magento2/core/not_found_exec.js';
import { _wyvr } from '@src/magento2/core/not_found_wyvr.js';
import { load_category_by_slug } from '@src/magento2/category/load_category_by_slug.js';
import { load_category_products } from '@src/magento2/category/load_category_products.js';

const slug = get_config('shop.slug.category', 'category');
export default {
    url: `/[store]/${slug}/[slug]`,
    onExec: async ({ request, params, data, setStatus }) => {
        if (!data?.store?.value) {
            get_logger().warning('missing store id in category', data.url);
            return data;
        }

        const store_id = data.store.value;

        const [category_error, category] = await load_category_by_slug(params.slug, store_id);

        if (category_error) {
            get_logger().error(category_error);
            return await onExec({ data, setStatus });
        }

        if (!category.is_active) {
            get_logger().error('category is disabled', request.url, category.entity_id);
            data.not_found = true;
            data.avoid_not_found = false;
            data.force_not_found = true;
            return await onExec({ data, setStatus });
        }

        category.products = [];

        const [products_error, products] = await load_category_products(category.entity_id, store_id);
        if (!products_error) {
            category.products = products;
        }

        data.category = category;

        return data;
    },
    _wyvr: ({ data, params }) => {
        if (!data || !data.category) {
            return _wyvr({ data });
        }
        const result = {
            ...(data?._wyvr ?? {}),
            ...{
                template: ['shop/Category', 'shop/Default'],
                methods: ['get'],
                persist: true,
            },
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

        result.template = [`shop/category/id/${data.category.entity_id}`, `shop/category/slug/${params.slug}`, ...path, ...result.template];

        return result;
    },
    title: ({ params, data }) => data.category?.name || data?.title || params.slug,
    content: ({ data }) => {
        return data?.content || '';
    },
};
