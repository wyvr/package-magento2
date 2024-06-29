import { admin_token } from '@src/shop/api/admin_token';
import { Config } from '@wyvr/generator/src/utils/config.js';
import { set_cache } from '@src/shop/core/cache';

export default async function () {
    const admin_user = Config.get('_secrets.magento2.admin_user');
    const admin_password = Config.get('_secrets.magento2.admin_password');
    const token = await admin_token(admin_user, admin_password);
    set_cache('admin_token', token);
    return token;
}
