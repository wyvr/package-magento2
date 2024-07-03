import { Config } from '@wyvr/generator/src/utils/config.js';
import { logger } from '@wyvr/generator/universal.js';
import { Cwd } from '@wyvr/generator/src/vars/cwd.js';
import { FOLDER_GEN } from '@wyvr/generator/src/constants/folder.js';
import { write } from '@wyvr/generator/src/utils/file.js';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

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
        const ext = extname(request.url);
        if (
            [
                '.jpg',
                '.jpeg',
                '.png',
                '.gif',
                '.webp',
                '.avif',
                '.svg',
            ].includes(ext)
        ) {
            // persist the generated image
            const path = Cwd.get(request.url);
            logger.info('fallback media', request.url);
            write(path, content);
            return returnData(content);
        }
        logger.warning('fallback image, invalid image extension', ext);
        return returnData(content, 404);
    } catch (e) {
        logger.error('default image error', e.message);
        return returnData('media not found', 404);
    }
}
