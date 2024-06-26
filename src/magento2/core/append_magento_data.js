import { get_magento_data } from '@src/magento2/core/data.js';

export async function append_magento_data(url, append_to) {
    const magento_data = await get_magento_data(url);
    for (const key of Object.keys(magento_data)) {
        append_to[key] = magento_data[key];
    }
    if (append_to.locale) {
        if (!append_to._wyvr) {
            append_to._wyvr = {};
        }
        append_to._wyvr.language = append_to.locale;
    }
    return append_to;
}
