// magento 2 visibility values and meaning
const VISIBILITY_NOT_VISIBLE = 1;
const VISIBILITY_IN_CATALOG = 2;
const VISIBILITY_IN_SEARCH = 3;
const VISIBILITY_BOTH = 4;

export function get_product_index_name(store_id) {
    return `wyvr_product_${store_id}`;
}

export function get_product_query(store_id, term = '', size = 1000) {
    const term_query = term
        ? [
              { term: { sku: { value: term, boost: 10000 } } },
              { term: { name: { value: term, boost: 10000 } } },
              { prefix: { sku: { value: term, boost: 1000 } } },
              { match: { name: { query: term, boost: 100 } } },
              {
                  match: {
                      search: {
                          query: term,
                          fuzziness: 0,
                          boost: 10,
                      },
                  },
              },
              {
                  match: {
                      search: {
                          query: term,
                          fuzziness: 1,
                          boost: 1,
                      },
                  },
              },
          ]
        : [];
    const product_query = {
        index: get_product_index_name(store_id),
        size,
        query: {
            bool: {
                must: {
                    dis_max: {
                        queries: [].concat(term_query),
                    },
                },
                filter: [{ terms: { visibility: [VISIBILITY_IN_SEARCH, VISIBILITY_BOTH] } }],
            },
        },
    };
    
    if (term) {
        product_query.suggest = {
            text: term,
            suggestion: {
                term: {
                    field: 'search',
                },
                // phrase: {
                //     field: 'search',
                // },
            },
        };
    }
    return product_query;
}
export function get_catalog_products_query(store_id, size = 10000, query = undefined, sort = undefined) {
    const product_query = {
        index: get_product_index_name(store_id),
        size,
        query: {
            bool: {
                filter: [{ terms: { visibility: [VISIBILITY_IN_CATALOG, VISIBILITY_BOTH] } }],
            },
        },
    };
    if(query) {
        product_query.query = Object.assign({}, product_query.query, query);
    }
    if(sort) {
        product_query.sort = sort;
    }
    return product_query;
}

export function get_product_id_query(store_id, id) {
    return {
        index: get_product_index_name(store_id),
        size: 1,
        query: {
            match: { id: { query: id } },
        },
    };
}
export function get_product_sku_query(store_id, sku) {
    return {
        index: get_product_index_name(store_id),
        size: 1,
        query: {
            match: { sku: sku.toLowerCase() },
        },
    };
}
