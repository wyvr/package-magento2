import { url_join } from '@src/shop/core/url.js';

export function forgot_password_link() {
    const domain = injectConfig('shop.domain');
    return url_join(domain, 'customer', 'account', 'forgotpassword');
}
