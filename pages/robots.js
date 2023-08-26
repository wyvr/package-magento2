import { load_data } from '@src/shop/core/elasticsearch.mjs';
import { Config } from '@wyvr/generator/src/utils/config.js';

export default async function (page_data) {
    const default_store_name = Config.get('shop.default_store');
    const stores = Config.get('shop.stores');
    const default_store = stores[default_store_name];
    const data = await load_data('wyvr_settings', { id: default_store });
    // robots content from magento 2
    let robots = {};
    if (data && data[0]) {
        robots = data[0]?.value?.design?.search_engine_robots;
    }
    let content = '';
    if (robots.custom_instructions) {
        content = robots.custom_instructions;
    } else {
        content = robots.default_custom_instructions || '';
    }
    return [
        {
            url: '/robots.txt',
            _wyvr: {
                template: ['Robots', 'Empty'],
                collection: { visible: false, name: 'robots.txt' },
                private: true,
            },
            content,
        },
    ];
}
