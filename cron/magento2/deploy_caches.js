import { logger } from '@wyvr/generator/universal.js';
import {
    exists_index,
    get_client,
    clear_index,
} from '@src/shop/core/elasticsearch.js';
import { index } from '@src/magento2/core/clear_caches.js';

export default async function () {
    const client = get_client();

    try {
        await client.ping();
    } catch (err) {
        logger.error('elasticsearch error:', err.message);
        return;
    }

    if (!(await exists_index(index))) {
        return;
    }

    // clear the cache
    await clear_index(index);
}
