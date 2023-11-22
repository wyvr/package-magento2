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
            if (
                typeof clone[attribute] == 'object' &&
                clone[attribute]?.value !== undefined
            ) {
                clone[attribute].value = value;
            }
            // stock mus also be injected into quantity_and_stock_status
            if (attribute == 'stock' && clone.quantity_and_stock_status) {
                if (
                    typeof clone.quantity_and_stock_status == 'object' &&
                    clone.quantity_and_stock_status?.value !== undefined
                ) {
                    clone.quantity_and_stock_status.value = value;
                } else {
                    clone.quantity_and_stock_status = value;
                }
            }
        });
        loaded = true;
        return clone;
    }
</script>

<div class="live" class:enabled class:loaded>
    <slot product={final_product} />
</div>
