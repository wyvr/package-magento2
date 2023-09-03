import { Config } from '@wyvr/generator/src/utils/config.js';
import { Logger } from '@wyvr/generator/src/utils/logger.js';
import { Cwd } from '@wyvr/generator/src/vars/cwd.js';
import { FOLDER_GEN } from '@wyvr/generator/src/constants/folder.js';
//import { get } from '@src/shop/core/settings.mjs';
import { readFile } from 'node:fs/promises';

export async function onExec({ returnData, returnJson }) {
    const store_name = Config.get('shop.default_store');
    const stores = Config.get('shop.stores');
    const store_id = stores[store_name];
    if (!store_id) {
        return returnJson({ message: __('shop.internal_error') }, 500);
    }
    const default_image = Config.get('magento2.product.default_image');

    const image_path = Cwd.get(FOLDER_GEN, default_image);
    try {
        /**
         * @TODO
         * - process media based on the config
         * - persist the generated image
         * - create lsit of errored images
         * - create cronjob which removes the list and the images in it to force regeneration of errored images
         */
        const content = await readFile(image_path);
        returnData(content);
    } catch (e) {
        Logger.error('default image error', e.message);
        return returnData('media not found', 404);
    }
}
