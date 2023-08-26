import { load_data } from '@src/shop/core/elasticsearch.mjs';
import { Logger } from '@wyvr/generator/src/utils/logger.js';
import { Config } from '@wyvr/generator/src/utils/config.js';
import { get_error_message } from '@wyvr/generator/src/utils/error.js';
import { onExec, _wyvr } from '@src/shop/core/not_found.mjs';
import { replace_meta_content } from '@src/shop/core/meta/replace_meta_content.mjs';

const slug = Config.get('shop.slug.product', 'product');

export default {
    url: `/[store]/${slug}/[slug]`,
    onExec: async ({ params, data, setStatus }) => {
        if (!data?.store?.value) {
            Logger.warning('missing data in product', data.url);
            return data;
        }
        let start = new Date().getTime();
        const product_data = await load_data(`wyvr_product_${data.store.value}`, { url: params.slug });
        if (!Array.isArray(product_data) || product_data.length == 0) {
            return await onExec({ data, setStatus });
        }
        let product;
        try {
            product = product_data[0].product;
        } catch (e) {
            Logger.error(
                'product convert error',
                params.slug,
                get_error_message(e, import.meta.url, 'magento2 product')
            );
        }
        if (!product) {
            return await onExec({ data, setStatus });
        }

        if (product?.status?.value !== '1') {
            return data;
        }

        data.product = product;
        data.timing = { product: new Date().getTime() - start };

        return data;
    },
    _wyvr: ({ data }) => {
        if (!data || !data.product) {
            return _wyvr({ data });
        }

        const type = data.product.type_id.charAt(0).toUpperCase() + data.product.type_id.slice(1);
        const sku = typeof data.product.sku == 'string' ? data.product.sku : data.product.sku.value;
        const wyvr_data = {
            template: [
                `shop/product/id/${data.product.entity_id}`,
                `shop/product/sku/${sku}`,
                `shop/product/${type}`,
                'shop/Product',
                'shop/Default',
            ],
            methods: ['get'],
            persist: true,
            language: data?.locale || 'en',
        };

        return wyvr_data;
    },
    title: ({ params, data }) => data.product?.name?.value || params.slug,
    meta: ({ params, data }) => {
        const meta = {
            title: replace_meta_content(data.product?.name?.value || params.slug),
        };
        return meta;
    },
    content: ({ data }) => {
        // return data.product?.description || '';
        return data.product?.description?.label || data?.content || '';
    },
};
