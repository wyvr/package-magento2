import { category_index_update } from '@src/magento2/category/category_index_update.js';

export default async function (context) {
    await category_index_update();
}
