import { get } from '@src/shop/core/settings.mjs';
import { get_page_by_url } from '@src/magento2/core/data.mjs';

export async function onExec({ data, setStatus }) {
    if(data?.avoid_not_found) {
        return data;
    }
    data.not_found = true;
    setStatus(404);
    const store_id = data?.store?.value;
    if (store_id == null) {
        return data;
    }
    const no_route = await get(store_id, 'web.default.cms_no_route', `magento 2 not found in store`);
    if (!no_route) {
        return data;
    }

    const page_data = await get_page_by_url(store_id, no_route);

    Object.keys(page_data).forEach((key) => {
        data[key] = page_data[key];
    });

    return data;
}
export function _wyvr({ data }) {
    if(data?.avoid_not_found) {
        return data?._wyvr;
    }
    const wyvr_data = {
        template: [`shop/NotFound`, 'shop/Default'],
        persist: false,
        language: data?.locale || 'en',
    };
    return wyvr_data;
}
