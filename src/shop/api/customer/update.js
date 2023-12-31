import { Logger } from '@wyvr/generator/src/utils/logger.js';
import { jsonOptions, magentoUrl, put, authOptions } from '@src/shop/api/api';
import { get_admin_token } from '@src/shop/logic/get_admin_token.mjs';
import { get_customer } from '@src/shop/api/customer/get.js';

export async function update_customer(store, id, data, isProd) {
    if (!data || !id) {
        Logger.error('magento2 update customer, missing data or id', id);
        return [__('shop.internal_error'), undefined];
    }
    const admin_token = await get_admin_token(isProd);
    if (!admin_token) {
        Logger.error('magento2 update customer, missing admin token');
        return [__('shop.internal_error'), undefined];
    }
    const [get_error, customer] = await get_customer(store, id, isProd);
    if (get_error) {
        return [get_error, undefined];
    }

    let modified = [];
    // update customer values
    if (data.customer) {
        // change only allowed attributes
        ['firstname', 'lastname', 'email', 'newsletter'].forEach((key) => {
            if (data.customer[key] !== undefined) {
                modified.push({ type: 'customer', key });
                if (key == 'newsletter') {
                    if (!customer.additional) {
                        customer.additional = {};
                    }
                    customer.additional.is_subscribed = data.customer[key];
                    return;
                }
                customer[key] = data.customer[key];
            }
        });
    }
    // add addresses
    if (Array.isArray(data.customer?.addresses)) {
        modified.push('addresses');
        customer.addresses = data.customer.addresses;
    }
    // avoid update when nothing has changed
    if (modified.length == 0) {
        return [undefined, customer];
    }
    const put_url = magentoUrl(`/rest/all/V1/customers/${id}`);

    // transform additional to extension_attributes
    if (customer.additional) {
        customer.extension_attributes = { ...customer.additional };
        delete customer.additional;
    }

    let update_result;
    try {
        update_result = await put(put_url, authOptions(admin_token, jsonOptions({ body: { customer } })));
        if (!update_result.ok) {
            Logger.warning(
                'magento2 update customer, request failed',
                update_result.status,
                update_result.statusText,
                update_result.body
            );
            return [__('shop.internal_error'), undefined];
        }
    } catch (e) {
        Logger.error(get_error_message(e, token_url, 'magento2 get customer'));
        return returnJSON({ message: __('shop.internal_error') }, 500);
    }
    // transform extension_attributes to additional
    if (update_result?.body?.extension_attributes) {
        update_result.body.additional = { ...update_result.body.extension_attributes };
        delete update_result.body.extension_attributes;
    }
    return [undefined, update_result?.body];
}
