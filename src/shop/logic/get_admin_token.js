import { get_cache } from '@src/shop/core/cache.js';
import admin_token_update from '@src/shop/logic/admin_token_update.js';

export async function get_admin_token(isProd = true) {
    let admin_token = get_cache('admin_token');
    if (!isProd || !admin_token) {
        admin_token = await admin_token_update();
    }
    return admin_token;
}
