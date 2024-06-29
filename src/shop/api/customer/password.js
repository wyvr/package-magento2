import { logger, get_error_message } from '@wyvr/generator/universal.js';
import { jsonOptions, magentoUrl, put, authOptions } from '@src/shop/api/api';
import { get_admin_token } from '@src/shop/logic/get_admin_token.js';
import { get_customer } from '@src/shop/api/customer/get.js';
import { login_customer } from '@src/shop/api/customer/login';
import { replaceParameters } from '@src/shop/api/api';

export async function change_password(store, id, email, data, isProd) {
    const save_error = __('account.error_saving');
    if (!data || !id) {
        logger.error('magento2 update customer, missing data or id', id);
        return [__('shop.internal_error'), undefined];
    }
    const admin_token = await get_admin_token(isProd);
    if (!admin_token) {
        logger.error('magento2 update customer, missing admin token');
        return [__('shop.internal_error'), undefined];
    }
    const [get_error, customer] = await get_customer(store, id, isProd);
    if (get_error) {
        return [get_error, undefined];
    }

    const [message, status, token] = await login_customer(store, email, data.current_password, isProd);

    if (!token) {
        return [message, undefined];
    }
    if (!store) {
        logger.error('magento2 change password store is not defined');
        return [__('shop.internal_error'), undefined];
    }

    const password_url = magentoUrl(`/rest/${store}/V1/customers/me/password`);

    let password_result;
    try {
        password_result = await put(password_url, authOptions(token, jsonOptions({ body: data })));
        if (!password_result.ok) {
            const message = replaceParameters(password_result?.body);
            if (!message) {
                logger.warning('magento2 change password, request failed', password_result.status, password_result.statusText, password_result.body);
                return [save_error, undefined];
            }
            return [message, undefined];
        }
    } catch (e) {
        logger.error(get_error_message(e, token_url, 'magento2 change password'));
        return returnJSON({ message: __('shop.internal_error') }, 500);
    }

    return [undefined, password_result?.body];
}
