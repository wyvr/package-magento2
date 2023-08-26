<script>
    export let title;
    export let content;
    export let is_active;
    export let identifier;
</script>

{#if is_active && content}
    <section class="widget widget-{identifier || 'no-identifier'}">
        {#if title}
            <header>{title}</header>
        {/if}
        {@html content}
    </section>
{/if}

<style>
    section {
        padding: 1rem;
        border: 1px solid var(--color-text);
    }
</style>