import { Logger } from '@wyvr/generator/src/utils/logger.js';
import { get_error_message } from '@wyvr/generator/src/utils/error.js';

import { appendSearchCriteriaToUrl, authOptions, get, jsonOptions, magentoUrl, post } from '@src/shop/api/api.js';
import * as DB from '@src/magento2/database/customer.js';
import { get_form_body_value } from '@src/shop/api-client/get_form_body_value';
import { get_admin_token } from '@src/shop/logic/get_admin_token.mjs';

export default {
    url: '/[store]/api/customer/login/',
    _wyvr: () => {
        return {
            methods: ['post'],
        };
    },
    onExec: async ({ params, returnJSON, setStatus, body, isProd }) => {
        const internal_error = __('shop.internal_error');
        const login_error = __('customer.login_error');
        const email = get_form_body_value(body?.email);
        const data = {};
        const store = params?.store;
        const errors = [];

        ['email', 'password'].forEach((field) => {
            const value = get_form_body_value(body[field]);
            const name = field.trim().toLowerCase();

            if (!value) {
                errors.push(__('shop.missing_required_field', { name: __('customer.' + name) }));
                return;
            }
            data[field] = value;
        });
        if (errors.length > 0) {
            return returnJSON({ message: errors }, 400);
        }
        // @TODO sanitize email
        const payload = {
            username: data.email,
            password: data.password,
        };

        const customer = {};
        const token_url = magentoUrl(`/rest/all/V1/integration/customer/token`);

        // get customer token
        try {
            const token_result = await post(
                token_url,
                jsonOptions({
                    body: payload,
                })
            );
            if (!token_result.ok) {
                Logger.warning(
                    'magento2 login, customer token request failed',
                    token_result.status,
                    token_result.statusText
                );
                return returnJSON({ message: login_error }, 403);
            }
            let token = token_result.body;
            if (!token || typeof token != 'string') {
                Logger.warning('magento2 login, empty or wrong token');
                return returnJSON({ message: login_error }, 403);
            }
            customer.token = token;
        } catch (e) {
            Logger.error(get_error_message(e, token_url, 'magento2 login'));
            return returnJSON({ message: internal_error }, 500);
        }

        // get customer information
        const admin_token = await get_admin_token(isProd);
        if (admin_token) {
            const customer_url = appendSearchCriteriaToUrl(magentoUrl(`/rest/all/V1/customers/search`), {
                filter: [{ field: 'email', conditionType: 'eq', value: email }],
                pageSize: 1,
            });
            let customers;
            try {
                const customer_result = await get(customer_url, authOptions(admin_token, jsonOptions({})));
                if (customer_result.ok) {
                    customers = customer_result.body?.items || [];
                }
            } catch (e) {
                Logger.error(get_error_message(e, customer_url, 'magento2 login'));
                return returnJSON({ message: internal_error }, 500);
            }
            if (!customers || !Array.isArray(customers) || customers.length == 0) {
                Logger.warning('magento2 login, no customer found');
                return returnJSON({ message: login_error }, 403);
            }
            customer.email = customers[0].email;
            customer.id = customers[0].id;
            customer.firstname = customers[0].firstname;
            customer.lastname = customers[0].lastname;
            customer.store_id = customers[0].store_id;
            customer.website_id = customers[0].website_id;
            customer.additional = customers[0].extension_attributes;
            customer.addresses = customers[0].addresses;

            // store the current login in the storage
            await DB.open();
            await DB.set('login', customers[0].email, {
                email: customers[0].email,
                id: customers[0].id,
                token: customer.token,
                created: new Date().getTime(),
            });
            await DB.close();
        }

        return returnJSON(customer);
    },
};
