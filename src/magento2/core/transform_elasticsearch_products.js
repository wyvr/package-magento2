import { Config } from '@wyvr/generator/src/utils/config.js';
import category_product_attributes from '@src/shop/config/category_product_attributes.mjs';
import { reduce_attributes } from '@src/shop/core/attributes.mjs';

const allowed_attributes = Config.get('shop.attributes.list.allow');
const denied_attributes = Config.get('shop.attributes.list.deny');

export function transform_elasticsearch_products(products) {
    return products.map((product_data) => {
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
