import { get_config, get_logger, get_error_message } from '@wyvr/generator/cron.js';
import { symlink, exists } from '@wyvr/generator/src/utils/file.js';
import { ReleasePath } from '@wyvr/generator/src/vars/release_path.js';
import { join } from 'path';

export function shop_symlink() {
    try {
        const symlink_source = get_config('magento2.symlink');
        const shop_subdir = get_config('magento2.shop_subdir', 'shop');
        if (!symlink_source) {
            get_logger().debug('shop symlink not defined');
            return;
        }
        if (!exists(symlink_source)) {
            get_logger().error('shop symlink target does not exist', symlink_source);
            return;
        }
        const target = join(ReleasePath.get(), shop_subdir);
        get_logger().info('symlink', target, '>', symlink_source);
        const created = symlink(symlink_source, target);
        if (created) {
            get_logger().success('shop symlink created');
        } else {
            get_logger().error('shop symlink could not be created');
        }
    } catch (e) {
        get_logger().error('error create symlink', get_error_message(e));
        return;
    }
}
