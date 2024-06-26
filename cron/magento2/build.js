import admin_token_update from '@src/shop/logic/admin_token_update.js';
import { category_index_update } from '@src/magento2/category/category_index_update.js';
import { update_navigation } from '@src/magento2/navigation/update_navigation.js';
import { shop_symlink } from '@src/magento2/logic/shop_symlink.js';

export default async function () {
    await admin_token_update();
    await category_index_update();
    await update_navigation();
    shop_symlink();
}
