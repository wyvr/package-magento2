<script>
    import { get_category_id_query } from '@src/shop/core/search/category.mjs';
    import { search } from '@src/shop/core/elasticsearch.mjs';

    export let anchor_text;
    export let title;
    export let id_path;

    let url;
    let data;

    onServer(async () => {
        if (!id_path || typeof id_path != 'string') {
            return;
        }
        const id = id_path.replace(/category\//, '');
        if (!id) {
            return;
        }
        const result = await search(get_category_id_query(getWyvrData('store.value', 0), id));
        url = `/${[getWyvrData('store.key'), _inject('config.shop.slug.category', 'c'), result?.hits?.hits[0]?._source?.url].filter((x) => x).join('/')}/`;
    });
</script>

{#if url}
    <div class="widget block block-category-link">
        <a href={url} {title}>
            <span>{anchor_text}</span>
        </a>
    </div>
{/if}
