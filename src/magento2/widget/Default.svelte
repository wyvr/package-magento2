<script>
    import { Env } from '@wyvr/generator/src/vars/env.js';
</script>

{#if Env.is_dev()}
    <div>
        ⚠ Widget with default template, not visible
        <pre>{JSON.stringify($$props, null, 4)}</pre>
    </div>
{/if}

<style>
    div {
        padding: 10px;
        background-color:#ffe5b6;
        border:1px solid #7a5000;
        color: #7a5000;
    }
</style>