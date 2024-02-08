import { Logger } from '@wyvr/generator/src/utils/logger.js';
import { jsonOptions, magentoUrl, get, authOptions, appendSearchCriteriaToUrl } from '@src/shop/api/api';
import { get_admin_token } from '@src/shop/logic/get_admin_token.mjs';

export async function get_orders(store, email, isProd) {
    const admin_token = await get_admin_token(isProd);
    if (!admin_token) {
        Logger.error('magento2 get orders, missing admin token');
        return [__('shop.internal_error'), undefined];
    }
    const get_url = appendSearchCriteriaToUrl(magentoUrl('/rest/all/V1/orders/'), {
        filter: [{ field: 'customer_email', conditionType: 'eq', value: email }],
        sort: [{ field: 'entity_id', direction: 'DESC' }]
    });
    let get_result;
    try {
        get_result = await get(get_url, authOptions(admin_token, jsonOptions({})));
        if (!get_result.ok) {
            Logger.warning('magento2 get orders, request failed', get_result.status, get_result.statusText, get_result.body);
            return [__('shop.internal_error'), undefined];
        }
    } catch (e) {
        Logger.error(get_error_message(e, token_url, 'magento2 get orders'));
        return returnJSON({ message: __('shop.internal_error') }, 500);
    }
    return [undefined, get_result?.body];
}
