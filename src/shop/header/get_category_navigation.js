import { Config } from '@wyvr/generator/src/utils/config.js';
import { get } from '@src/magento2/database/navigation.js';
import { Logger } from '@wyvr/generator/src/utils/logger.js';
import { get_error_message } from '@wyvr/generator/src/utils/error.js';

export async function get_category_navigation(store_name) {
    const stores = Config.get('shop.stores');

    let category = [];

    const store_id = stores[store_name];
    if (!store_id) {
        return category;
    }
    try {
        category = get(store_id);
    } catch (e) {
        Logger.error(get_error_message(e, import.meta.url, 'magento category navigation'));
    }
    if (!category) {
        return [];
    }

    return category;
}
