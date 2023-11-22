<script>
    import Live from '@src/magento2/product/live/Live.svelte';
    import Price from '@src/shop/product/Price.svelte';

    wyvr: {
        render: 'hydrate';
        loading: 'lazy';
    }

    export let product;
    export let locale = 'en';
    export let currency = 'EUR';
</script>

<Live {product} let:product>
    {#if product}
        <Price {product} {locale} {currency} />
    {/if}
</Live>
