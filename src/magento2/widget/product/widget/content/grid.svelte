<script>
    import { get_domain } from '@src/shop/api-client/get_domain';
    import { get_store } from '@src/shop/api-client/get_store';
    import { url_join } from '@src/shop/core/url.mjs';
    import ProductsSlider from '@src/shop/component/ProductsSlider.svelte';
    import { get_time_stamp_minutes } from '@src/shop/core/cache_breaker.mjs';
    import { encode_conditions } from '@src/shop/core/widgets/encode_conditions';
    import { onMount } from 'svelte';

    wyvr: {
        render: 'hydrate';
        loading: 'lazy';
    }

    export let title;
    export let show_pager;
    export let products_per_page;
    export let products_count;
    export let conditions_encoded;
    export let products;

    let currency;
    let locale;

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

        conditions_encoded = encode_conditions(conditions_encoded);
    });

    onMount(() => {
        const conditions = [];
        Object.keys(conditions_encoded).forEach((key) => {
            const element = conditions_encoded[key];
            if (element.operator) {
                delete element.type;
                conditions.push(element);
                return;
            }
        });

        const cb = get_time_stamp_minutes();
        fetch(
            url_join(get_domain(), get_store(), 'api', 'query_products') +
                `?conditions=${encodeURIComponent(JSON.stringify(conditions))}&amount=${products_count}&cb=${cb}`
        )
            .then((x) => x.json())
            .then((data) => {
                if (data.products) {
                    products = data.products;
                    currency = data.currency;
                    locale = data.locale;
                }
            });
    });
</script>

<ProductsSlider {title} {show_pager} {products_per_page} {products} {store_key} {currency} {locale} />
