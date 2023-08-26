export function transform_result(search_result, prop_name, fn) {
    const hits = search_result?.hits?.hits;
    if (!prop_name || !Array.isArray(hits)) {
        return [];
    }
    return hits
        .map((hit) => {
            if (!hit || !hit._source) {// || !hit._source[prop_name]
                return undefined;
            }
            const item = hit._source[prop_name];
            if (typeof fn != 'function') {
                return item;
            }
            // can throw an error, catch and handle them when used
            return fn(item);
        })
        .filter((x) => x);
}
