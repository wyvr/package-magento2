import admin_token_update from '@src/shop/logic/admin_token_update.mjs';

export default async function () {
    const token = await admin_token_update();
}
