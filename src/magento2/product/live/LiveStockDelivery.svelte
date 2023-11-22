<script>
    import Live from '@src/magento2/product/live/Live.svelte';
    import Stock from '@src/shop/product/Stock.svelte';
    import Delivery from '@src/shop/product/Delivery.svelte';

    wyvr: {
        render: 'hydrate';
        loading: 'lazy';
    }

    export let product;
</script>

<Live {product} let:product>
    {#if product}
        <Delivery {product} />
        <Stock {product} />
    {/if}
</Live>
