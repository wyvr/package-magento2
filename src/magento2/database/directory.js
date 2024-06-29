import { get_cache, set_cache } from '@src/shop/core/cache.js';

export const name = 'magento_directory';

function get_cache_name(store) {
    return `${name}_${store}`;
}

export function get(type) {
    return get_cache(get_cache_name(type));
}
export function set(type, value) {
    set_cache(get_cache_name(type), value);
}
