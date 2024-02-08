import { EnvType } from '@wyvr/generator/src/struc/env.js';
import { Config } from '@wyvr/generator/src/utils/config.js';
import { DemoPage } from '@src/shop/core/demo_page.mjs';

export default async function (data) {
    const config = Config.get('magento2');
    const result = [];
    if (data.env === EnvType.dev) {
        const demo_page = DemoPage(config?.integration);
        result.push(demo_page);
    }
    return result;
}
