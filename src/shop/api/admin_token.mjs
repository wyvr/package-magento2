import { logger } from '@wyvr/generator/universal.js';
import { jsonOptions, magentoUrl, post } from './api.js';

export async function admin_token(username, password) {
    const result = await post(
        magentoUrl('/rest/all/V1/integration/admin/token'),
        jsonOptions({
            body: { username, password }
        })
    );

    if (!result.ok) {
        logger.error('admin token could not be received', result.status, result.statusText, result.body);
        return null;
    }
    return result.body;
}
