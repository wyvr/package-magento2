export function encode_conditions(value) {
    if (!value || typeof value !== 'string') {
        return undefined;
    }
    const replaced = value
        .replace(/`/g, '"')
        .replace(/\^\[/g, '{')
        .replace(/\^\]/g, '}')
        .replace(/\^/g, '')
        .replace(/\|\|/g, '/');
    try {
        return JSON.parse(replaced);
    } catch (e) {
        console.log(replaced, e);
    }
    return undefined;
}
