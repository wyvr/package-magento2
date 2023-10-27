import { is_string } from '@wyvr/generator/src/utils/validate.js';
import { Logger } from '@wyvr/generator/src/utils/logger.js';
import { get_error_message } from '@wyvr/generator/src/utils/error.js';

import * as DB from '@src/magento2/database/customer.js';

export async function valid(email, token) {
    const error_message = __('customer.invalid_error');
    const customer = {};

    customer.email = email;

    // store the current login in the storage
    let result;
    try {
        await DB.open();
        result = await DB.get('login', email);
        await DB.close();
    } catch (e) {
        Logger.error(get_error_message(e, import.meta.url, 'magento2 customer login database'));
    }

    let login_data = undefined;
    if (result) {
        try {
            login_data = JSON.parse(result.value);
        } catch (e) {
            Logger.error(get_error_message(e, import.meta.url, 'magento2 customer'));
        }
    }
    if (!login_data) {
        return [error_message, customer];
    }
    // get token from header
    if (is_string(token)) {
        token = token.replace(/^bearer /i, '');
    }

    // validate token
    if (!login_data.token || login_data.token !== token) {
        Logger.error('invalid token for customer', email, token);
        return [error_message, customer];
    }

    // validate expiration date
    // @NOTE 24 Hours *  60 Minutes * 60 (seconds per minute) * 1000 (milliseconds per second)
    const valid_minutes = 24 * 60 * 60000;
    const valid_until = login_data.created + valid_minutes;
    if (!!login_data.created && valid_until < new Date().getTime()) {
        Logger.error('expired login for customer', email, 'valid until', new Date(valid_until));
        return [error_message, customer];
    }

    customer.id = login_data?.id;
    customer.valid_until = valid_until;

    return [undefined, customer];
}
