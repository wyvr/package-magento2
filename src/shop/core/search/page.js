export function get_page_index_name(store_id) {
    return `wyvr_page_${store_id}`;
}
export function get_page_query(store_id, term, size) {
    return {
        index: get_page_index_name(store_id),
        size,
        query: {
            bool: {
                must: {
                    dis_max: {
                        queries: [
                            { term: { name: { value: term, boost: 10000 } } },
                            { match: { name: { query: term, boost: 100 } } },
                            {
                                match: {
                                    search: {
                                        query: term,
                                        fuzziness: 0,
                                        boost: 10
                                    }
                                }
                            },
                            {
                                match: {
                                    search: {
                                        query: term,
                                        fuzziness: 1,
                                        boost: 1
                                    }
                                }
                            }
                        ]
                    }
                },
                filter: [{ terms: { is_active: [true] } }]
            }
        },
        suggest: {
            text: term,
            suggestion: {
                term: {
                    field: 'search'
                }
                // phrase: {
                //     field: 'search',
                // },
            }
        }
    };
}

export function get_page_id_query(store_id, id) {
    return {
        index: get_page_index_name(store_id),
        size: 1,
        query: {
            match: { id: { query: id } }
        }
    };
}
