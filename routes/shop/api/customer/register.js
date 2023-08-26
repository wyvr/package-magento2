import { Logger } from '@wyvr/generator/src/utils/logger.js';
import { jsonOptions, magentoUrl, post } from '@src/shop/api/api';
import { get_form_body_value } from '@src/shop/api-client/get_form_body_value';
import { register_allowed_fields } from '@src/shop/config/register_allowed_fields';
import { register_required_fields } from '@src/shop/config/register_required_fields';

export default {
    url: '/[store]/api/customer/register/',
    _wyvr: () => {
        return {
            methods: ['post'],
        };
    },
    onExec: async ({ params, returnJSON, body }) => {
        const customer = {};
        const errors = [];
        const store = params?.store;

        Object.keys(body).forEach((field) => {
            const value = get_form_body_value(body[field]);
            const name = field.trim().toLowerCase();
            // ignore not allowed fields
            if (register_allowed_fields.indexOf(name) == -1) {
                return;
            }
            // not required fields can be added to the customer
            if (register_required_fields.indexOf(name) == -1) {
                customer[field] = value;
            }
            if (!value) {
                errors.push(__('shop.missing_required_field', { name: __('customer.' + name) }));
                return;
            }
            customer[field] = value;
        });

        // validate values
        ['firstname', 'lastname'].forEach((field) => {
            const value = customer[field];
            if (!value) {
                return;
            }
            if (value.match(/\P{L}/)) {
                errors.push(__('shop.invalid_field', { name: __('customer.' + field) }));
                return;
            }
        });

        if (errors.length > 0) {
            return returnJSON({ message: errors }, 500);
        }

        const register_url = magentoUrl(`/${store}/rest/all/V1/customers`);
        const payload = {
            customer: {
                firstname: customer.firstname,
                lastname: customer.lastname,
                email: customer.email,
                extension_attributes: {
                    is_subscribed: customer.newsletter === 'true',
                },
            },
            password: customer.password,
        };

        try {
            const register_result = await post(
                register_url,
                jsonOptions({
                    body: payload,
                })
            );
            if (!register_result.ok) {
                Logger.warning(
                    'magento2 register, customer create request failed',
                    register_result.status,
                    register_result.statusText,
                    register_result.body
                );
                return returnJSON({ message: __('shop_register.error') }, register_result.status);
            }
        } catch (e) {
            Logger.error(get_error_message(e, token_url, 'magento2 register'));
            return returnJSON({ message: __('shop.internal_error') }, 500);
        }

        return returnJSON({ message: __('shop_register.success', customer), email: customer.email });
    },
};
