import { search } from '@src/shop/core/elasticsearch.mjs';
import { get_product_query } from '@src/shop/core/search/product.mjs';
import { get_category_query } from '@src/shop/core/search/category.mjs';
import { get_page_query } from '@src/shop/core/search/page.mjs';
import { logger, get_error_message } from '@wyvr/generator/universal.js';
import search_product_attributes from '@src/shop/config/search_product_attributes.mjs';
import { get_suggestions } from '@src/shop/core/search/suggestion.mjs';
import { transform_result } from '@src/shop/core/search/transform_result.mjs';

export async function search_execute(term, store_id, size) {
    const search_term = (term === undefined || term === null ? '' : term).toLowerCase();
    const result = {
        search: {},
        timing: {},
        term: search_term,
        found: false,
        suggestion: []
    };
    if (search_term) {
        const action_results = await Promise.all([
            search_execute_index(search_term, store_id, size, 'category', get_category_query),
            search_execute_index(search_term, store_id, size, 'page', get_page_query),
            search_execute_index(search_term, store_id, size, 'product', get_product_query, (product) => {
                const result = {};
                for (const key of Object.keys(product)) {
                    if (search_product_attributes.indexOf(key) > -1) {
                        result[key] = product[key];
                    }
                }
                return result;
            })
        ]);

        for (const entry of action_results) {
            result.search[entry.type] = entry.hits;
            if (entry.hits.length > 0) {
                result.found = true;
            }
            result.timing[entry.type] = entry.timing;
            result.suggestion = entry.suggestion;
        }
    }
    return result;
}

export async function search_execute_index(term, store_id, size, type, query_fn, fn) {
    const start = new Date().getTime();
    const result = {
        timing: 0,
        suggestion: [],
        hits: [],
        type
    };
    if (typeof query_fn !== 'function') {
        return result;
    }
    try {
        const query = query_fn(store_id, term, size);
        const search_result = await search(query);
        result.hits = transform_result(search_result, type, fn);
        result.suggestion = get_suggestions(search_result);
    } catch (e) {
        logger.error('search', type, 'error', term, get_error_message(e, import.meta.url, 'magento2 search'));
    }
    result.timing = new Date().getTime() - start;
    return result;
}
