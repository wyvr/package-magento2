import { get_page_by_url } from '@src/magento2/core/data.mjs';

export async function append_cms_page(url, store_id, append_to) {
    if (!url) {
        return append_to;
    }
    const page_parts = url.match(/^\/[^\/]+\/(.*)\/$/);
    if (page_parts) {
        const page_data = await get_page_by_url(store_id, page_parts[1]);

        if (Object.keys(page_data).length == 0) {
            return append_to;
        }
        append_to.avoid_not_found = true;

        Object.keys(page_data).forEach((key) => {
            append_to[key] = page_data[key];
        });

        append_to._wyvr = {
            template: [`shop/page/${page_parts[1]}`, `shop/Page`, 'shop/Default'],
            persist: true,
            language: append_to.locale || 'en',
        };
    }
    return append_to;
}
