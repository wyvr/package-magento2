<script>
    import { get_page_id_query } from '@src/shop/core/search/page.mjs';
    import { search } from '@src/shop/core/elasticsearch.mjs';

    export let anchor_text;
    export let title;
    export let page_id;

    let url;

    onServer(async () => {
        if (!page_id) {
            return;
        }
        const result = await search(get_page_id_query(getWyvrData('store.value', 0), page_id));
        const identifier = result?.hits?.hits[0]?._source?.page?.identifier || '';
        url = `/${[getWyvrData('store.key'), identifier].filter((x) => x).join('/')}/`;
    });
</script>

{#if url}
    <div class="widget block block-cms-link">
        <a href={url} {title}>
            <span>{anchor_text}</span>
        </a>
    </div>
{/if}
