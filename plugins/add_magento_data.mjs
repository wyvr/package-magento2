import { append_magento_data } from '@src/magento2/core/append_magento_data.mjs';
import { append_cms_page } from '@src/magento2/core/append_cms_page.mjs';
import { append_home_page } from '@src/magento2/core/append_home_page.mjs';

export default {
    construct_route_context: {
        after: async ({result}) => {
            if(!result?.data) {
                return result;
            }
            // pages and build step execute this plugin avoid double execution
            if(result.data.has_magento_data) {
                return result;
            }
            result.data.has_magento_data = true;
            result.data = await append_magento_data(result.data?.url, result.data || {});

            const store_id = result.data?.store?.value;
            // @TODO Homepage redirect is not working in this plugin because it only generates
            result.data = await append_home_page(result.data?.url, store_id, result.data, (location) => {
                result.setStatus(301);
                result.setHeader('location', location);
            });
            result.data = await append_cms_page(result.data?.url, store_id, result.data);
            return result;
        },
    },
};