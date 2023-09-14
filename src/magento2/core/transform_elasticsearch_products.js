import category_product_attributes from '@src/shop/config/category_product_attributes.mjs';
import { reduce_attributes } from '@src/shop/core/attributes.mjs';

export function transform_elasticsearch_products(products) {
    return products.map((product_data) => {
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
    });
}
