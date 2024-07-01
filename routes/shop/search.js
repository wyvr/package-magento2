import { Config } from '@wyvr/generator/src/utils/config.js';
import { get } from '@src/shop/core/settings.js';
import { search_execute } from '@src/shop/core/search/search.js';
import { redirectInvalidStoreRoute } from '@src/shop/route/redirectInvalidStoreRoute.js';

export default {
    url: '/[store]/search',
    onExec: async (context) =>
        await redirectInvalidStoreRoute(context, async ({ params, query }) => {
            const stores = Config.get('shop.stores');
            const store_id = stores[params.store];
            const date = new Date();

            const code = await get(
                store_id,
                'general.locale.code',
                'magento 2 search',
                'en_US'
            );
            const locale = code.split('_')[0];

            const currency = await get(
                store_id,
                'currency.options.default',
                'magento 2 search',
                'EUR'
            );

            const size = 12;
            const search_result = await search_execute(query.q, store_id, size);

            return {
                store: {
                    key: params.store,
                    value: stores[params.store],
                },
                stores,
                date,
                search: search_result.search,
                locale,
                term: search_result.term,
                currency,
                timing: search_result.timing,
                suggestion: search_result.suggestion,
            };
        }),
    _wyvr: ({ data }) => {
        return {
            ...(data?._wyvr ?? {}),
            ...{
                template: ['shop/Search', 'shop/Default'],
                methods: ['get', 'post'],
                persist: false,
            },
        };
    },
    title: () => __('search.search'),
    content: ({ data }) => {
        return `<pre>${JSON.stringify(data, null, 4)}</pre>`;
    },
};
