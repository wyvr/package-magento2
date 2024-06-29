import { logger, get_error_message } from '@wyvr/generator/universal.js';
import { jsonOptions, magentoUrl, put, authOptions } from '@src/shop/api/api';
import { get_admin_token } from '@src/shop/logic/get_admin_token.js';
import { get_customer } from '@src/shop/api/customer/get.js';

export async function update_customer(store, id, data, isProd) {
    if (!data || !id) {
        logger.error('magento2 update customer, missing data or id', id);
        return [__('shop.internal_error'), undefined];
    }
    const admin_token = await get_admin_token(isProd);
    if (!admin_token) {
        logger.error('magento2 update customer, missing admin token');
        return [__('shop.internal_error'), undefined];
    }
    const [get_error, customer] = await get_customer(store, id, isProd);
    if (get_error) {
        return [get_error, undefined];
    }

    const modified = [];
    // update customer values
    if (data.customer) {
        // change only allowed attributes
        for (const key of ['firstname', 'lastname', 'email', 'newsletter']) {
            if (data.customer[key] !== undefined) {
                modified.push({ type: 'customer', key });
                if (key === 'newsletter') {
                    if (!customer.additional) {
                        customer.additional = {};
                    }
                    customer.additional.is_subscribed = data.customer[key];
                    continue;
                }
                customer[key] = data.customer[key];
            }
        }
    }
    // add addresses
    if (Array.isArray(data.customer?.addresses)) {
        modified.push('addresses');
        customer.addresses = data.customer.addresses;
    }
    // avoid update when nothing has changed
    if (modified.length === 0) {
        return [undefined, customer];
    }
    const put_url = magentoUrl(`/rest/all/V1/customers/${id}`);

    // transform additional to extension_attributes
    if (customer.additional) {
        customer.extension_attributes = { ...customer.additional };
        customer.additional = undefined;
    }

    let update_result;
    try {
        update_result = await put(put_url, authOptions(admin_token, jsonOptions({ body: { customer } })));
        if (!update_result.ok) {
            logger.warning('magento2 update customer, request failed', update_result.status, update_result.statusText, update_result.body);
            return [__('shop.internal_error'), undefined];
        }
    } catch (e) {
        logger.error(get_error_message(e, token_url, 'magento2 get customer'));
        return returnJSON({ message: __('shop.internal_error') }, 500);
    }
    // transform extension_attributes to additional
    if (update_result?.body?.extension_attributes) {
        update_result.body.additional = {
            ...update_result.body.extension_attributes
        };
        update_result.body.extension_attributes = undefined;
    }
    return [undefined, update_result?.body];
}
