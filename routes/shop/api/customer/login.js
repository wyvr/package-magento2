import { logger, get_error_message } from '@wyvr/generator/universal.js';

import { appendSearchCriteriaToUrl, authOptions, get, jsonOptions, magentoUrl } from '@src/shop/api/api.js';
import * as DB from '@src/magento2/database/customer.js';
import { get_form_body_value } from '@src/shop/api-client/get_form_body_value';
import { get_admin_token } from '@src/shop/logic/get_admin_token.js';
import { login_customer } from '@src/shop/api/customer/login';
import { validate_store } from '@src/shop/core/validate_store.js';

export default {
    url: '/[store]/api/customer/login/',
    _wyvr: () => {
        return {
            methods: ['post']
        };
    },
    onExec: async ({ params, returnJSON, body, isProd }) => {
        if (!validate_store(params?.store)) {
            return returnJSON({}, 404);
        }
        const internal_error = __('shop.internal_error');
        const login_error = __('customer.login_error');
        const email = get_form_body_value(body?.email);
        const data = {};
        const store = params?.store;
        const errors = [];

        for (const field of ['email', 'password']) {
            const value = get_form_body_value(body[field]);
            const name = field.trim().toLowerCase();

            if (!value) {
                errors.push(__('shop.missing_required_field', { name: __(`customer.${name}`) }));
                continue;
            }
            data[field] = value;
        }
        if (errors.length > 0) {
            return returnJSON({ message: errors }, 400);
        }

        const [message, status, token] = await login_customer(store, data.email, data.password, isProd);

        const customer = {};

        if (!token) {
            return returnJSON({ message }, status);
        }
        customer.token = token;

        // get customer information
        const admin_token = await get_admin_token(isProd);
        if (admin_token) {
            const customer_url = appendSearchCriteriaToUrl(magentoUrl('/rest/all/V1/customers/search'), {
                filter: [{ field: 'email', conditionType: 'eq', value: email }],
                pageSize: 1
            });
            let customers;
            try {
                const customer_result = await get(customer_url, authOptions(admin_token, jsonOptions({})));
                if (customer_result.ok) {
                    customers = customer_result.body?.items || [];
                }
            } catch (e) {
                logger.error(get_error_message(e, customer_url, 'magento2 login'));
                return returnJSON({ message: internal_error }, 500);
            }
            if (!customers || !Array.isArray(customers) || customers.length === 0) {
                logger.warning('magento2 login, no customer found');
                return returnJSON({ message: login_error }, 403);
            }

            for (const key of ['email', 'id', 'firstname', 'lastname', 'store_id', 'website_id', 'extension_attributes', 'addresses']) {
                customer[key === 'extension_attributes' ? 'additional' : key] = customers[0][key];
            }
            // store the current login in the storage
            await DB.open();
            await DB.set('login', customers[0].email, {
                email: customers[0].email,
                id: customers[0].id,
                token: customer.token,
                created: new Date().getTime()
            });
            await DB.close();
        }

        return returnJSON(customer);
    }
};
