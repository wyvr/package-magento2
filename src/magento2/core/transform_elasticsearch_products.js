import category_product_attributes from '@src/shop/config/category_product_attributes.mjs';
import { VISIBILITY_IN_CATALOG, VISIBILITY_BOTH } from '@src/shop/core/search/product.mjs';
import { reduce_attributes, get_attribute_value } from '@src/shop/core/attributes.mjs';

export function transform_elasticsearch_products(products) {
    return products
        .map((product_data) => {
            if (product_data) {
                const visibility = get_attribute_value(product_data, 'visibility');
                const status = get_attribute_value(product_data, 'status');
                if (status != '1' || (visibility != VISIBILITY_IN_CATALOG && visibility != VISIBILITY_BOTH)) {
                    return undefined;
                }
            }
            const product = {};
            Object.keys(product_data)
                .filter((key) => category_product_attributes.indexOf(key) > -1)
                .forEach((key) => {
                    if (key == 'configurable_products') {
                        const child_products = product_data.configurable_products
                            .map((child_product) => reduce_attributes(child_product, category_product_attributes))
                            .filter((x) => x);

                        product[key] = child_products;
                        return;
                    }
                    product[key] = product_data[key];
                });
            return reduce_attributes(product, category_product_attributes);
        })
        .filter(Boolean);
}
