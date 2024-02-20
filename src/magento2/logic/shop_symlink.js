import { get_config } from '@wyvr/generator/cron.js';
import { logger, get_error_message } from '@wyvr/generator/universal.js';
import { symlink, exists } from '@wyvr/generator/src/utils/file.js';
import { ReleasePath } from '@wyvr/generator/src/vars/release_path.js';
import { join } from 'path';

export function shop_symlink() {
    try {
        const symlink_source = get_config('magento2.symlink');
        const shop_subdir = get_config('magento2.shop_subdir', 'shop');
        if (!symlink_source) {
            logger.debug('shop symlink not defined');
            return;
        }
        if (!exists(symlink_source)) {
            logger.error('shop symlink target does not exist', symlink_source);
            return;
        }
        const target = join(ReleasePath.get(), shop_subdir);
        logger.info('symlink', target, '>', symlink_source);
        const created = symlink(symlink_source, target);
        if (created) {
            logger.success('shop symlink created');
        } else {
            logger.error('shop symlink could not be created');
        }
    } catch (e) {
        logger.error('error create symlink', get_error_message(e));
        return;
    }
}
