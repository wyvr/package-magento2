import { get_page_by_url } from '@src/magento2/core/data.mjs';
import { get } from '@src/shop/core/settings.mjs';

export async function append_home_page(url, store_id, append_to, redirect_fn) {
    const home_route = await get(store_id, 'web.default.cms_home_page', `magento 2 home route`);

    if (home_route) {
        append_to.magento_home_route = home_route;
        const home_page_regex = new RegExp(`^/(<store>[^/]+)/${home_route}/$`);
        const home_page_result = url.match(home_page_regex);
        if (home_page_result) {
            const new_home = `/${home_page_result.store}/`;
            append_to.redirect_to = new_home;
            if (typeof redirect_fn == 'function') {
                redirect_fn(new_home);
            }
        }
        // root page or store page
        if (url == '/' || url.match(new RegExp(`^/(?:${Object.keys(append_to.stores).join('|')})+/$`))) {
            const page_data = await get_page_by_url(store_id, home_route);

            Object.keys(page_data).forEach((key) => {
                append_to[key] = page_data[key];
            });
            append_to.avoid_not_found = true;
            append_to.home_page = true;
            if (!append_to._wyvr) {
                append_to._wyvr = {};
            }
            (append_to._wyvr.template = [`shop/HomePage`, 'shop/Default'].concat(append_to._wyvr.template || [])),
                (append_to._wyvr.persist = true),
                (append_to._wyvr.language = append_to.locale || 'en');
        }
    }
    return append_to;
}
