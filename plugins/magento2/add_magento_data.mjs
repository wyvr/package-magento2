import { append_magento_data } from '@src/shop/core/data.mjs';
import { append_cms_page } from '@src/shop/core/page/cms_page.mjs';
import { append_home_page } from '@src/shop/core/page/home_page.mjs';

export default {
    construct_route_context: {
        after: async ({ result }) => {
            result.data = await append_magento_data(result?.data?.url, result?.data || {});

            const store_id = result.data?.store?.value;

            result.data = await append_home_page(result?.data?.url, store_id, result.data, (location) => {
                result.response.writeHead(301, {
                    location,
                });
                result.response.end();
            });
            result.data = await append_cms_page(result?.data?.url, store_id, result?.data);
            
            return result;
        },
    },
};