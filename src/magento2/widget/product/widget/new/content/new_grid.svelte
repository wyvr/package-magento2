<script>
    import { get_time_stamp_minutes } from '@src/shop/core/cache_breaker.mjs';
    import ProductsSlider from '@src/shop/component/ProductsSlider.svelte';
    import { onMount } from 'svelte';
    import { url_join } from '@src/shop/core/url.mjs';
    import { get_domain } from '@src/shop/api-client/get_domain';
    import { get_store } from '@src/shop/api-client/get_store';

    wyvr: {
        render: 'hydrate';
        loading: 'lazy';
    }

    export let display_type;
    export let show_pager;
    export let products_per_page;
    export let products_count;
    export let products = [];

    let currency;
    let locale;
    let date;

    onServer(() => {
        try {
            products_count = JSON.parse(products_count);
        } catch (e) {
            products_count = 10;
        }
        try {
            products_per_page = JSON.parse(products_per_page);
        } catch (e) {
            products_per_page = 5;
        }
        show_pager = show_pager === '1';
        products = new Array(products_count).fill(false);
    });
    onMount(() => {
        let flag = display_type == 'newest_products' ? 'new' : 'all';
        const cb = get_time_stamp_minutes();

        fetch(url_join(get_domain(), get_store(), 'api', 'newest_products', flag, products_count) + `?cb=${cb}`)
            .then((x) => x.json())
            .then((data) => {
                if (data.products) {
                    products = data.products;
                    currency = data.currency;
                    locale = data.locale;
                    date = data.date;
                }
            });
    });
</script>

<ProductsSlider {show_pager} {products_per_page} {products} {store_key} {currency} {locale} />
