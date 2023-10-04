import { load_data } from '@src/shop/core/elasticsearch.mjs';
import { Logger } from '@wyvr/generator/src/utils/logger.js';
import { Config } from '@wyvr/generator/src/utils/config.js';
import { get_error_message } from '@wyvr/generator/src/utils/error.js';
import { onExec, _wyvr } from '@src/shop/core/not_found.mjs';
import { replace_meta_content } from '@src/shop/core/meta/replace_meta_content.mjs';
import { url_join } from '@src/shop/core/url.mjs';

const domain = Config.get('url');
const slug = Config.get('shop.slug.product', 'product');
const redirect_simple_to_configurable = Config.get('magento2.product.redirect_simple_to_configurable', false);

export default {
    url: `/[store]/${slug}/[slug]`,
    onExec: async ({ params, data, setStatus, returnRedirect, isProd }) => {
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

        if (
            redirect_simple_to_configurable &&
            product.type_id == 'simple' &&
            Array.isArray(product.parent_products) &&
            product.parent_products.length > 0
        ) {
            const configurable_product = product.parent_products.find((product) => product.url_key);
            product.redirect_simple_to_configurable = true;
            const status = isProd ? 301 : 302;
            const configurable_url = url_join(
                `https://${domain.replace(/https?:\/\//, '')}`,
                params.store,
                slug,
                configurable_product.url_key
            );

            return returnRedirect(configurable_url, status, {
                'set-cookie': `redirect_from_simple=${params.slug}; path=/${params.store};`,
            });
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
        
        return {
            ...(data?._wyvr ?? {}),
            ...{
                template: [
                    `shop/product/id/${data.product.entity_id}`,
                    `shop/product/sku/${sku}`,
                    `shop/product/${type}`,
                    'shop/Product',
                    'shop/Default',
                ],
                methods: ['get'],
                persist: true,
            },
        };
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
