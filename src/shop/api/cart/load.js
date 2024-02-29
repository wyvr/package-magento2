import { logger, get_error_message } from '@wyvr/generator/universal.js';

import * as DB from '@src/magento2/database/customer.js';

export async function load_cart(email) {
    let loaded_cart;

    // try load the cart from storage
    try {
        await DB.open();
        const result = await DB.get('cart', email);
        await DB.close();
        if (result) {
            loaded_cart = JSON.parse(result.value);
        }
    } catch (e) {
        logger.error(get_error_message(e, import.meta.url, 'magento2 load cart'));
    }
    const id = loaded_cart?.id;
    if (loaded_cart && loaded_cart.valid_until > new Date().getTime()) {
        return [id, loaded_cart];
    }
    return [id, undefined];
}
