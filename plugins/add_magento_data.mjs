import { append_magento_data } from '@src/shop/core/data.mjs';
import { append_cms_page } from '@src/shop/core/page/cms_page.mjs';
import { append_home_page } from '@src/shop/core/page/home_page.mjs';

export default {
    process_page_data: {
        after: async ({result}) => {
            // pages and build step execute this plugin avoid double execution
            if(result.has_magento_data) {
                return result;
            }
            result.has_magento_data = true;
            result = await append_magento_data(result?.url, result || {});

            const store_id = result?.store?.value;
            // @TODO Homepage redirect is not working in this plugin because it only generates
            /*
            result = await append_home_page(result?.url, store_id, result, (location) => {
                result.response.writeHead(301, {
                    location,
                });
                result.response.end();
            });*/
            result = await append_cms_page(result?.url, store_id, result);
            return result;
        },
    },
};