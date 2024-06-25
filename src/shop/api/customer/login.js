import { logger, get_error_message } from '@wyvr/generator/universal.js';
import { jsonOptions, magentoUrl, post } from '@src/shop/api/api.js';
import { is_valid_email, sanitize_email } from '@src/shop/validator/email.js';

export async function login_customer(store, email, password, isProd) {
    const internal_error = __('shop.internal_error');
    const login_error = __('customer.login_error');
    if (!is_valid_email(email)) {
        logger.warning('magento2 login, invalid email', email);
        return [login_error, 400, undefined];
    }
    const payload = {
        username: sanitize_email(email),
        password: password,
    };

    const token_url = magentoUrl('/rest/all/V1/integration/customer/token');

    // get customer token
    try {
        const token_result = await post(
            token_url,
            jsonOptions({
                body: payload,
            })
        );
        if (!token_result.ok) {
            logger.warning(
                'magento2 login, customer token request failed',
                token_result.status,
                token_result.statusText
            );
            return [login_error, 403, undefined];
        }
        const token = token_result.body;
        if (!token || typeof token !== 'string') {
            logger.warning('magento2 login, empty or wrong token');
            return [login_error, 403, undefined];
        }
        return [undefined, undefined, token];
    } catch (e) {
        logger.error(get_error_message(e, token_url, 'magento2 login'));
        return [internal_error, 500, undefined];
    }
}
