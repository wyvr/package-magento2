import { load_data } from '@src/shop/core/elasticsearch.mjs';

export async function get_block_by_id(store_id, block_id) {

    if (store_id == undefined || block_id == undefined) {
        return undefined;
    }
    const block_data = await load_data(`wyvr_block_${store_id}`, { id: block_id });
    if (!Array.isArray(block_data) || block_data.length == 0 || !block_data[0].block) {
        return undefined;
    }
    return block_data[0].block;
}
