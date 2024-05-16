import { logger, get_error_message } from '@wyvr/generator/universal.js';
import { Config } from '@wyvr/generator/src/utils/config.js';

export async function get(url, config = {}) {
    config.method = 'GET';
    return await request(url, config);
}
export async function post(url, config = {}) {
    config.method = 'POST';
    return await request(url, config);
}
export async function put(url, config = {}) {
    config.method = 'PUT';
    return await request(url, config);
}
export async function patch(url, config = {}) {
    config.method = 'PATCH';
    return await request(url, config);
}
export async function del(url, config = {}) {
    config.method = 'DELETE';
    return await request(url, config);
}
export async function request(url, config = {}) {
    let response = undefined;
    let ok = false;
    let body = undefined;
    let isJson = false;
    const headers = {};
    const cookies = [];
    try {
        const options = Object.assign(
            {
                method: 'get'
            },
            config
        );
        if (options.body && typeof options.body !== 'string') {
            options.body = JSON.stringify(options.body);
        }
        response = await fetch(url, options);

        const cookies = [];

        response?.headers?.forEach((value, key) => {
            const new_key = key.toLowerCase();
            if (new_key === 'set-cookie') {
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
        logger.error(get_error_message(e, url, 'magento2 request'));
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
        url: response.url
    };
}

function convertCookieToObject(cookieString) {
    const chunks = cookieString.split('; ');
    const cookie = {};

    for (const chunk of chunks) {
        const [key, value] = chunk.split('=');
        const norm_key = key.toLowerCase();

        if (norm_key === 'max-age') {
            cookie['max-age'] = parseInt(value, 10);
        } else if (norm_key === 'secure' || norm_key === 'httponly') {
            cookie[norm_key] = true;
        } else {
            cookie[norm_key] = value;
        }
    }

    return cookie;
}

export function jsonOptions(options) {
    if (!options || typeof options !== 'object') {
        return options;
    }
    if (!options.headers) {
        options.headers = {};
    }
    options.headers.accept = 'application/json';
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
    options.headers.authorization = `Bearer ${bearer}`;
    return options;
}
export function magentoUrl(url) {
    const domain = Config.get('shop.api_domain');
    if (!domain) {
        return url;
    }
    const magento_url = `${domain.trim().replace(/\/$/, '')}/${url.trim().replace(/^\//, '')}`;
    logger.debug('magento request', magento_url);
    return magento_url;
}
export function appendSearchCriteriaToUrl(url, search_criteria, propName = 'searchCriteria') {
    const seperator = url.indexOf('?') > -1 ? '&' : '?';
    return (
        url +
        seperator +
        Object.keys(search_criteria)
            .map((key) => {
                if (key === 'filter') {
                    const name = `${propName}[filterGroups][0][filters]`;
                    return search_criteria[key]
                        .map((filter, index) => {
                            return Object.keys(filter)
                                .map((filter_key) => {
                                    return getSearchCriteriaParam(`${name}[${index}][${filter_key}]`, search_criteria[key][index][filter_key]);
                                })
                                .join('&');
                        })
                        .join('&');
                }
                if (key === 'sort') {
                    const name = `${propName}[sortOrders]`;
                    return search_criteria[key]
                        .map((sort, index) => {
                            return Object.keys(sort)
                                .map((sort_key) => {
                                    return getSearchCriteriaParam(`${name}[${index}][${sort_key}]`, search_criteria[key][index][sort_key]);
                                })
                                .join('&');
                        })
                        .join('&');
                }
                return getSearchCriteriaParam(`${propName}[${key}]`, search_criteria[key]);
            })
            .join('&')
    );
}

export function replaceParameters(body) {
    if (!body || !body.message) {
        return '';
    }
    if (!Array.isArray(body.parameters) || body.parameters.length === 0) {
        return body.message;
    }
    return body.message.replace(/%(\d+)/, (_, idx) => {
        const index = parseInt(idx, 10);
        if (Number.isNaN(index)) {
            return '';
        }
        return body.parameters[index];
    });
}

function getSearchCriteriaParam(key, value = '') {
    return `${encodeURIComponent(`${key}`)}=${encodeURIComponent(value)}`;
}
