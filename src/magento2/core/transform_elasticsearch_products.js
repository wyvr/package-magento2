import { logger, get_error_message } from '@wyvr/generator/universal.js';
import category_product_attributes from '@src/shop/config/category_product_attributes.mjs';
import { VISIBILITY_IN_CATALOG, VISIBILITY_BOTH } from '@src/shop/core/search/product.mjs';
import { reduce_attributes, get_attribute_value } from '@src/shop/core/attributes.mjs';

export function transform_elasticsearch_products(products) {
    return products
        .map((product_data) => {
            try {
                if (product_data) {
                    const visibility = Number.parseInt(get_attribute_value(product_data, 'visibility') ?? '0');
                    const status = `${get_attribute_value(product_data, 'status')}`;
                    if (status !== '1' || ![VISIBILITY_IN_CATALOG, VISIBILITY_BOTH].includes(visibility)) {
                        return undefined;
                    }
                }
                const product = {};
                for (const key of Object.keys(product_data)) {
                    if (category_product_attributes.includes(key)) {
                        product[key] = product_data[key];
                    }
                }

                // hide configurable products that have no simples attached
                if (product_data?.type_id === 'configurable' && product_data?.configurable_products?.length === 0) {
                    return undefined;
                }
                return reduce_attributes(product, category_product_attributes);
            } catch (e) {
                logger.error(get_error_message(e, import.meta.url, 'tranform_elasticsearch_products'));
                return undefined;
            }
        })
        .filter(Boolean);
}
