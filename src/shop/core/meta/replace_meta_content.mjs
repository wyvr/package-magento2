import { decodeHTML } from 'entities';
import { filled_string } from '@wyvr/generator/src/utils/validate.js';

export function replace_meta_content(value) {
    if (!filled_string(value)) {
        return undefined;
    }
    return decodeHTML(value);
}
