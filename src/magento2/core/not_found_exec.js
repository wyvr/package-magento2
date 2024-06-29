import { Config } from '@wyvr/generator/src/utils/config.js';
import { get } from '@src/shop/core/settings.js';
import { get_page_by_url } from '@src/magento2/core/data.js';
import { object_to_query_param } from '@src/shop/core/url.js';

export async function onExec({ data, query, setStatus, returnRedirect, isProd }) {
    // redirect from root to default store when accessed directly
    const default_store = Config.get('shop.default_store');
    if (data.url === '/' && default_store) {
        return returnRedirect(`/${default_store}/${object_to_query_param(query)}`, isProd ? 301 : 302);
    }

    if (data?.avoid_not_found) {
        return data;
    }
    data.not_found = true;
    setStatus(404);
    const store_id = data?.store?.value;
    if (store_id == null) {
        return data;
    }
    const no_route = await get(store_id, 'web.default.cms_no_route', 'magento 2 not found in store');
    if (!no_route) {
        return data;
    }

    const page_data = await get_page_by_url(store_id, no_route);

    for (const key of Object.keys(page_data)) {
        data[key] = page_data[key];
    }

    return data;
}
