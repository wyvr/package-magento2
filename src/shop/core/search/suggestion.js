export function get_suggestions(search_result, min_score = 0.7) {
    return (search_result?.suggest?.suggestion || [])
        .map((sug) => {
            sug.options = sug.options.filter((option) => option.score >= min_score);
            if (sug.options.length == 0) {
                return undefined;
            }
            return sug;
        })
        .filter((x) => x);
}
