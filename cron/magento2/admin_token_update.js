import admin_token_update from '@src/shop/logic/admin_token_update.js';

export default async function () {
    const token = await admin_token_update();
}
