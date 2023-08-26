<script>
    export let block_id;
    export let title;
    export let identifier;
    export let content;
    export let creation_time;
    export let update_time;
    export let is_active;
    export let first_store_id;
    export let store_code;
    export let store_id;

    $: active = is_active === '1';
</script>

<table>
    <tr>
        <td>block_id</td>
        <td>{block_id}</td>
    </tr>
    <tr>
        <td>title</td>
        <td>{title}</td>
    </tr>
    <tr>
        <td>identifier</td>
        <td>{identifier}</td>
    </tr>
    <tr>
        <td>content</td>
        <td>{content}</td>
    </tr>
    <tr>
        <td>creation_time</td>
        <td>{creation_time}</td>
    </tr>
    <tr>
        <td>update_time</td>
        <td>{update_time}</td>
    </tr>
    <tr>
        <td>is_active</td>
        <td>{active}</td>
    </tr>
    <tr>
        <td>first_store_id</td>
        <td>{first_store_id}</td>
    </tr>
    <tr>
        <td>store_code</td>
        <td>{store_code}</td>
    </tr>
    <tr>
        <td>store_id</td>
        <td>{store_id}</td>
    </tr>
</table>