import { load_data } from '@src/shop/core/elasticsearch.js';
import { logger, get_error_message } from '@wyvr/generator/universal.js';
import { Config } from '@wyvr/generator/src/utils/config.js';
import { onExec } from '@src/magento2/core/not_found_exec.js';
import { _wyvr } from '@src/magento2/core/not_found_wyvr.js';
import { replace_meta_content } from '@src/shop/core/meta/replace_meta_content.js';
import { url_join, object_to_query_param } from '@src/shop/core/url.js';
import { get_attribute_value } from '@src/shop/core/attributes.js';
import { redirectInvalidStoreRoute } from '@src/shop/route/redirectInvalidStoreRoute.js';

const domain = Config.get('url');
const slug = Config.get('shop.slug.product', 'product');
const redirect_simple_to_configurable = Config.get(
    'magento2.product.redirect_simple_to_configurable',
    false
);

export default {
    url: `/[store]/${slug}/[slug]`,
    onExec: async (context) =>
        await redirectInvalidStoreRoute(
            context,
            async ({
                params,
                query,
                data,
                setStatus,
                returnRedirect,
                returnJSON,
                isProd,
            }) => {
                if (!data?.store?.value) {
                    logger.warning('missing data in product', data.url);
                    return data;
                }
                const product_index_name = `wyvr_product_${data.store.value}`;
                const start = new Date().getTime();
                const product_data = await load_data(product_index_name, {
                    url: params.slug,
                });
                if (!Array.isArray(product_data) || product_data.length === 0) {
                    return await onExec({ data, setStatus });
                }
                let product;
                try {
                    product = product_data[0].product;
                } catch (e) {
                    logger.error(
                        'product convert error',
                        params.slug,
                        get_error_message(
                            e,
                            import.meta.url,
                            'magento2 product'
                        )
                    );
                }
                if (!product) {
                    return await onExec({ data, setStatus });
                }
                // 1 enabled
                // 2 disabled
                if (product?.status?.value !== '1') {
                    logger.error(
                        'product is disabled',
                        data.url,
                        product.entity_id
                    );
                    data.not_found = true;
                    data.avoid_not_found = false;
                    data.force_not_found = true;
                    return await onExec({ data, setStatus });
                }

                // redirect from the simple to the configurable
                if (
                    redirect_simple_to_configurable &&
                    product.type_id === 'simple' &&
                    Array.isArray(product.parent_products) &&
                    product.parent_products.length > 0
                ) {
                    const configurable_product = product.parent_products.find(
                        (product) => product.url_key
                    );
                    product.redirect_simple_to_configurable = true;
                    const status = isProd ? 301 : 302;
                    const configurable_url = `${
                        url_join(
                            `https://${domain.replace(/https?:\/\//, '')}`,
                            params.store,
                            slug,
                            configurable_product.url_key
                        ) + object_to_query_param(query)
                    }#redirect_from_simple=${params.slug}`;

                    return returnRedirect(configurable_url, status);
                }
                // add missing configurable products to the configurable, because they can be eather a small object with missing properties or the entity id
                if (product.type_id === 'configurable') {
                    const products = await Promise.all(
                        product.configurable_products.map(async (entry) => {
                            let id;
                            if (typeof entry === 'string') {
                                id = entry;
                            }
                            if (entry?.entity_id) {
                                id = entry.entity_id;
                            }
                            if (!id) {
                                return undefined;
                            }
                            // load the product by the entity id
                            const product_data = await load_data(
                                product_index_name,
                                { id }
                            );
                            if (
                                !Array.isArray(product_data) ||
                                product_data.length === 0
                            ) {
                                return undefined;
                            }
                            return product_data[0]?.product;
                        })
                    );
                    product.configurable_products = products.filter(Boolean);
                }

                if (product?.status?.value !== '1') {
                    return data;
                }

                data.product = product;
                data.timing = { product: new Date().getTime() - start };

                return data;
            }
        ),
    _wyvr: ({ data }) => {
        if (!data || !data.product) {
            return _wyvr({ data });
        }

        let type = 'Unknown';
        if (typeof data?.product?.type_id === 'string') {
            type =
                data.product.type_id.charAt(0).toUpperCase() +
                data.product.type_id.slice(1);
        }
        const sku = get_attribute_value(data?.product, 'sku');

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
    title: ({ params, data }) =>
        get_attribute_value(data.product, 'name') || params.slug,
    meta: ({ params, data }) => {
        const meta = {
            title: replace_meta_content(
                get_attribute_value(data.product, 'name') || params.slug
            ),
        };
        return meta;
    },
    content: ({ data }) => {
        // return data.product?.description || '';
        return data.product?.description?.label || data?.content || '';
    },
};
