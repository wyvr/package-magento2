import { logger, get_error_message } from '@wyvr/generator/universal.js';
import { jsonOptions, magentoUrl, get, authOptions } from '@src/shop/api/api';
import { get_admin_token } from '@src/shop/logic/get_admin_token.mjs';

export async function get_customer(store, id, isProd) {
    const admin_token = await get_admin_token(isProd);
    if (!admin_token) {
        logger.error('magento2 get customer, missing admin token');
        return [__('shop.internal_error'), undefined];
    }
    const get_url = magentoUrl(`/rest/all/V1/customers/${id}`);

    let get_result;
    try {
        get_result = await get(get_url, authOptions(admin_token, jsonOptions({})));
        if (!get_result.ok) {
            logger.warning('magento2 get customer, request failed', get_result.status, get_result.statusText, get_result.body);
            return [__('shop.internal_error'), undefined];
        }
    } catch (e) {
        logger.error(get_error_message(e, token_url, 'magento2 get customer'));
        return returnJSON({ message: __('shop.internal_error') }, 500);
    }
    return [undefined, get_result?.body];
}
