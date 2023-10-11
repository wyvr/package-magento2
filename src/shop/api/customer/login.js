import { Logger } from '@wyvr/generator/src/utils/logger.js';
import { get_error_message } from '@wyvr/generator/src/utils/error.js';
import { jsonOptions, magentoUrl, post } from '@src/shop/api/api.js';

export async function login_customer(store, email, password, isProd) {
    const internal_error = __('shop.internal_error');
    const login_error = __('customer.login_error');
    // @TODO sanitize email
    const payload = {
        username: email,
        password: password,
    };

    const token_url = magentoUrl(`/rest/all/V1/integration/customer/token`);

    // get customer token
    try {
        const token_result = await post(
            token_url,
            jsonOptions({
                body: payload,
            })
        );
        if (!token_result.ok) {
            Logger.warning(
                'magento2 login, customer token request failed',
                token_result.status,
                token_result.statusText
            );
            return [login_error, 403, undefined];
        }
        let token = token_result.body;
        if (!token || typeof token != 'string') {
            Logger.warning('magento2 login, empty or wrong token');
            return [login_error, 403, undefined];
        }
        return [undefined, undefined, token];
    } catch (e) {
        Logger.error(get_error_message(e, token_url, 'magento2 login'));
        return [internal_error, 500, undefined];
    }
}
