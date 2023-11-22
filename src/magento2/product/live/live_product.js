import { isServer } from '@wyvr/generator';
import { getSharedStore, setSharedStore } from '@src/shop/stores/shared';
import { load_live_product } from '@src/magento2/api-client/product/load_live_product';

export const live_name = 'live';

const cache = {};
const subscribers = {};

function createLiveProduct() {
    if (isServer) {
        return null;
    }
    let store = getSharedStore(live_name);
    if (store) {
        return store;
    }

    const set = (sku, data) => {
        if (!sku || !Array.isArray(subscribers[sku])) {
            return;
        }
        cache[sku] = data;
        if (subscribers[sku].length > 0) {
            subscribers[sku].forEach((s) => s(data));
        }
    };

    store = {
        subscribe: (sku, listener) => {
            if (!sku || typeof listener != 'function') {
                return;
            }
            // store the listeners based on the sku
            if (!subscribers[sku]) {
                subscribers[sku] = [];
            }
            subscribers[sku].push(listener);
            // when value was already there return it instant
            if (cache[sku]) {
                listener(cache[sku]);
            } else {
                // when the entry is undefined, start loading
                if (cache[sku] === undefined) {
                    cache[sku] = false;
                    load_live_product(sku).then(([error, data]) => {
                        if(error) {
                            console.warn(error);
                            return;
                        }
                        set(sku, data);
                    });
                }
            }
            // unsubscribe
            return () => {
                const index = subscribers[sku].indexOf(listener);
                if (index > -1) {
                    subscribers[sku].splice(index, 1);
                }
            };
        },
    };
    return setSharedStore(live_name, store);
}

export const liveProduct = createLiveProduct();
