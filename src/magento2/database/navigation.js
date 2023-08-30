import { get_cache, set_cache } from '@src/shop/core/cache.mjs';

let db;
let connection;
let timer;

export const name = 'magento_navigation';

function get_cache_name(store) {
return `${name}_${store}`;
}

export function get(store) {
    return get_cache(get_cache_name(store));
}
export function set(store, value) {
    set_cache(get_cache_name(store), value)
}