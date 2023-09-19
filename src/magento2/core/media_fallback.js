import { Config } from '@wyvr/generator/src/utils/config.js';
import { Logger } from '@wyvr/generator/src/utils/logger.js';
import { Cwd } from '@wyvr/generator/src/vars/cwd.js';
import { FOLDER_GEN } from '@wyvr/generator/src/constants/folder.js';
import { write } from '@wyvr/generator/src/utils/file.js';
import { readFile } from 'node:fs/promises';

export async function onExec({ request, returnData, returnJSON, data }) {
    if (!data?.store?.value) {
        return returnJSON({ message: __('shop.internal_error') }, 500);
    }
    const default_image = Config.get('magento2.product.default_image');

    const image_path = Cwd.get(FOLDER_GEN, default_image);
    try {
        /**
         * @TODO
         * - process media based on the config
         * - create lsit of errored images
         * - create cronjob which removes the list and the images in it to force regeneration of errored images
         */
        const content = await readFile(image_path);
        // persist the generated image
        const path = Cwd.get(request.url);
        Logger.info('fallback media', request.url);
        write(path, content);

        returnData(content);
    } catch (e) {
        Logger.error('default image error', e.message);
        return returnData('media not found', 404);
    }
}
