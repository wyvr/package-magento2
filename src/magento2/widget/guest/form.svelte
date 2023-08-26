<script>
    wyvr: {
        render: 'hydrate';
        loading: 'interact';
    }

    let find_by_options = ['email', 'zip'];
    let find_by = 'email';

    let options = find_by_options.map((value) => ({ value, key: __('shop.' + value) }));
</script>

<div class="widget block block-orders-returns">
    <div class="block-title">
        <strong role="heading" aria-level="2">{__('shop.orders_and_returns')}</strong>
    </div>
    <div class="block-content">
        <!-- @TODO use correct action action="https://magento2.ddev.site/en/sales/guest/view/" -->
        <form
            id="widget-orders-and-returns-form"
            
            method="post"
            name="guest_post"
        >
            <fieldset>
                <div>
                    <label for="oar_type">{__('shop.find_order_by')}</label>

                    <div class="control">
                        <select
                            name="oar_type"
                            id="quick-search-type-id"
                            aria-required="true"
                            bind:value={find_by}
                        >
                            {#each options as option}
                                <option value={option.value}>{option.key}</option>
                            {/each}
                        </select>
                    </div>
                </div>
                <div>
                    <label for="oar-order-id">{__('shop.order_id')}</label>

                    <div class="control">
                        <input
                            type="text"
                            id="oar-order-id"
                            name="oar_order_id"
                            autocomplete="off"
                            required
                        />
                    </div>
                </div>
                <div>
                    <label for="oar-billing-lastname">{__('shop.billing_last_name')}</label>

                    <div class="control">
                        <input
                            type="text"
                            id="oar-billing-lastname"
                            name="oar_billing_lastname"
                            autocomplete="off"
                            required
                        />
                    </div>
                </div>
                {#if find_by == 'email'}
                    <div>
                        <label for="oar_email">{__('shop.email')}</label>

                        <div class="control">
                            <input
                                type="email"
                                id="oar_email"
                                name="oar_email"
                                autocomplete="off"
                                required
                            />
                        </div>
                    </div>
                {:else}
                    <div>
                        <label for="oar_zip">
                            {__('shop.zip')}
                        </label>

                        <div class="control">
                            <input type="text" class="input-text" id="oar_zip" name="oar_zip" required />
                        </div>
                    </div>
                {/if}
                <div>
                    <button type="submit" title={__('shop.search')}>{__('shop.search')}</button>
                </div>
            </fieldset>
        </form>
    </div>
</div>
