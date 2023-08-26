<script>
    export let content;
    export let is_active;
    export let identifier;

    $: active = is_active === '1';
</script>

{#if active && content}
<div class="widget widget-{identifier || 'no-identifier'}">
    {@html content}
</div>
{/if}

<style>
div :global(.message) {
    padding: 1em;
}
div :global(.info) {
    background: #fdf0d5;
    color: #6f4400;
}
</style>