import { Logger } from '@wyvr/generator/src/utils/logger.js';
import { get_error_message } from '@wyvr/generator/src/utils/error.js';
import { Config } from '@wyvr/generator/src/utils/config.js';

export async function get(url, config = {}) {
    config['method'] = 'GET';
    return await request(url, config);
}
export async function post(url, config = {}) {
    config['method'] = 'POST';
    return await request(url, config);
}
export async function put(url, config = {}) {
    config['method'] = 'PUT';
    return await request(url, config);
}
export async function patch(url, config = {}) {
    config['method'] = 'PATCH';
    return await request(url, config);
}
export async function del(url, config = {}) {
    config['method'] = 'DELETE';
    return await request(url, config);
}
export async function request(url, config = {}) {
    let response = undefined;
    let ok = false;
    let body = undefined;
    let isJson = false;
    let headers = {};
    let cookies = [];
    try {
        const options = Object.assign(
            {
                method: 'get',
            },
            config
        );
        if (options.body && typeof options.body != 'string') {
            options.body = JSON.stringify(options.body);
        }
        response = await fetch(url, options);

        const cookies = [];

        response?.headers?.forEach((value, key) => {
            const new_key = key.toLowerCase();
            if (new_key == 'set-cookie') {
                cookies.push(convertCookieToObject(value));
                return;
            }
            headers[new_key] = value;
        });

        const text = await response.text();

        try {
            body = JSON.parse(text);
            isJson = true;
        } catch (e) {
            body = text;
        }

        ok = response.status >= 200 && response.status < 400;
    } catch (e) {
        Logger.error(get_error_message(e, url, 'magento2 request'));
    }
    return {
        ok,
        status: response?.status,
        statusText: response?.statusText,
        isJson,
        body,
        headers,
        cookies,
        redirected: response?.redirected,
        type: response?.type,
        url: response.url,
    };
}

function convertCookieToObject(cookieString) {
    let chunks = cookieString.split('; ');
    let cookie = {};

    chunks.forEach((chunk) => {
        const [key, value] = chunk.split('=');
        const norm_key = key.toLowerCase();

        if (norm_key === 'max-age') {
            cookie['max-age'] = parseInt(value, 10);
        } else if (norm_key === 'secure' || norm_key === 'httponly') {
            cookie[norm_key] = true;
        } else {
            cookie[norm_key] = value;
        }
    });

    return cookie;
}

export function jsonOptions(options) {
    if (!options || typeof options !== 'object') {
        return options;
    }
    if (!options.headers) {
        options.headers = {};
    }
    options.headers['accept'] = 'application/json';
    options.headers['content-type'] = 'application/json';
    return options;
}
export function authOptions(bearer, options) {
    if (!options || typeof options !== 'object' || !bearer) {
        return options;
    }
    if (!options.headers) {
        options.headers = {};
    }
    options.headers['authorization'] = `Bearer ${bearer}`;
    return options;
}
export function magentoUrl(url) {
    const domain = Config.get('shop.api_domain');
    if (!domain) {
        return url;
    }
    return domain.trim().replace(/\/$/, '') + '/' + url.trim().replace(/^\//, '');
}
export function appendSearchCriteriaToUrl(url, search_criteria, propName = 'searchCriteria') {
    if (url.indexOf('?') > -1) {
        url += '&';
    } else {
        url += '?';
    }
    return (
        url +
        Object.keys(search_criteria)
            .map((key) => {
                if (key == 'filter') {
                    const name = `${propName}[filterGroups][0][filters]`;
                    return search_criteria[key]
                        .map((filter, index) => {
                            return Object.keys(filter)
                                .map((filter_key) => {
                                    return (
                                        encodeURIComponent(`${name}[${index}][${filter_key}]`) +
                                        '=' +
                                        encodeURIComponent(search_criteria[key][index][filter_key])
                                    );
                                })
                                .join('&');
                        })
                        .join('&');
                }
                if (key == 'sort') {
                    const name = `${propName}[sortOrders]`;
                    return search_criteria[key]
                        .map((sort, index) => {
                            return Object.keys(sort)
                                .map((sort_key) => {
                                    return (
                                        encodeURIComponent(`${name}[${index}][${sort_key}]`) +
                                        '=' +
                                        encodeURIComponent(search_criteria[key][index][sort_key])
                                    );
                                })
                                .join('&');
                        })
                        .join('&');
                }
                return encodeURIComponent(`${propName}[${key}]`) + '=' + encodeURIComponent(search_criteria[key]);
            })
            .join('&')
    );
}
