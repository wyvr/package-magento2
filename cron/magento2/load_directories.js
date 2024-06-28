import { get_config, logger, get_error_message } from '@wyvr/generator/universal.js';

import {
    filled_array,
    filled_string,
} from '@wyvr/generator/src/utils/validate.js';
import { set } from '@src/magento2/database/directory.js';

import {
    get,
    jsonOptions,
    authOptions,
    magentoUrl,
} from '@src/shop/api/api.js';

import { get_admin_token } from '@src/shop/logic/get_admin_token.mjs';

export default async function ({ isProd }) {
    const admin_token = await get_admin_token(isProd);
    if (!admin_token) {
        logger.error('missing admin token when loading magento2 directories');
        return;
    }
    const stores = get_config('shop.stores');

    for (const store_name of Object.keys(stores)) {
        await loadDirectory('countries', store_name, admin_token);
        // await loadDirectory('currency', store_name, admin_token);
    }
}

async function loadDirectory(type, store, admin_token) {
    if (!filled_string(type)) {
        logger.error(`magento2 directory, empty type`);
    }
    if (!filled_string(store)) {
        logger.error(`magento2 directory, empty store`);
    }
    const url = magentoUrl(`/rest/${store}/V1/directory/${type}`);
    try {
        const country_result = await get(
            url,
            authOptions(admin_token, jsonOptions({}))
        );
        if (!country_result.ok) {
            logger.warning(
                `magento2 directory ${type} in ${store}, request failed`,
                country_result.status,
                country_result.statusText
            );
            return;
        }
        if (!filled_array(country_result.body)) {
            logger.warning(
                `magento2 directory ${type} in ${store}, no or invalid data`
            );
            return;
        }
        set(`${type}_${store}`, country_result.body);
    } catch (e) {
        logger.error(
            get_error_message(e, url, `magento2 directory ${type} in ${store}`)
        );
    }
}
