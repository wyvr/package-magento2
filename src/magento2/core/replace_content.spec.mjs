import { strictEqual, deepStrictEqual } from 'assert';
import { Config } from '@wyvr/generator/src/utils/config.js';
import { replace_content } from './replace_content.mjs';

describe('magento2/core/replace_content', () => {
    it('null content', async () => {
        const content = await replace_content(null, 0);
        strictEqual(content, '');
    });
    it('empty content', async () => {
        const content = await replace_content('', 0);
        strictEqual(content, '');
    });
    it('extract media', async () => {
        const content = await replace_content('<img src="{{media url=wysiwyg/Favicon.png}}" alt=""/>', 0);
        strictEqual(content, `<img src="(media(src:\'${Config.get('shop.domain')}/media/wysiwyg/Favicon.png\'))" alt=""/>`);
    });
});
