<script>
    import { onMount } from 'svelte';
    import { get_attribute_value } from '@src/shop/core/attributes.mjs';
    import { liveProduct } from '@src/magento2/product/live/live_product';
    wyvr: {
        render: 'hydrate';
        loading: 'lazy';
    }

    export let product;

    let enabled = false;
    let loaded = false;
    let final_product;
    let sku;
    let unsubscribe;

    $: switch_product(product);

    onMount(() => {
        // enabled is required to active the loading of the product
        enabled = true;
        switch_product(product);
    });

    function switch_product(product) {
        sku = get_attribute_value(product, 'sku');
        final_product = update_product(product);
        // do not proceed when not mounted
        if (!enabled) {
            return;
        }
        loaded = false;
        // remove listener when there is something
        if (unsubscribe) {
            unsubscribe();
        }

        unsubscribe = liveProduct.subscribe(sku, (data) => {
            if (data) {
                final_product = update_product(product, data);
            }
        });
    }

    function update_product(product, data) {
        if (!enabled || !data) {
            return product;
        }
        const clone = { ...product };
        Object.entries(data).forEach(([attribute, value]) => {
            // check if the given attribute has a property value, then replace the value
            clone[attribute] = update_attribute(clone[attribute], value);

            // stock mus also be injected into quantity_and_stock_status
            if (attribute == 'stock' && clone.quantity_and_stock_status) {
                clone.quantity_and_stock_status = update_attribute(clone.quantity_and_stock_status, value);
            }
        });
        // correct final_price
        let final_price = get_attribute_value(product, 'final_price');
        if (final_price && typeof final_price == 'string') {
            final_price = parseFloat(final_price);
        }
        const special_price = data.special_price;
        if (special_price && special_price < final_price) {
            clone.final_price = update_attribute(clone.final_price, special_price);
        } else {
            if(data.price) {
                clone.final_price = update_attribute(clone.final_price, data.price);
            }
        }
        loaded = true;
        return clone;
    }

    function update_attribute(item, value) {
        if (!item) {
            return value;
        }
        if (typeof item == 'object' && item?.value !== undefined) {
            item.value = value;
            return item;
        }
        return value;
    }
</script>

<div class="live" class:enabled class:loaded>
    <slot product={final_product} />
</div>
