<script>
    import { get_product_id_query } from '@src/shop/core/search/product.mjs';
    import { search } from '@src/shop/core/elasticsearch.mjs';

    export let anchor_text;
    export let title;
    export let id_path;

    let url;

    onServer(async () => {
        if (!id_path) {
            return;
        }
        const id = id_path.replace(/product\//, '');
        if (!id) {
            return;
        }
        const result = await search(get_product_id_query(getWyvrData('store.value', 0), id));
        url = `/${[getWyvrData('store.key'), _inject('config.magento2.slug.product', 'p'), result?.hits?.hits[0]?._source?.url].filter((x) => x).join('/')}/`;
    });
</script>

{#if url}
    <div class="widget block block-product-link">
        <a href="https://magento2.ddev.site/en/joust-duffle-bag.html" {title}>
            <span>{anchor_text}</span>
        </a>
    </div>
{/if}
