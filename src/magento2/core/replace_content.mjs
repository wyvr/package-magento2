import { Config } from '@wyvr/generator/src/utils/config.js';
import { logger } from '@wyvr/generator/universal.js';
import { get_block_by_id } from '@src/shop/core/block.mjs';
import { get } from '@src/shop/core/settings.mjs';
import { exists } from '@wyvr/generator/src/utils/file.js';
import { FOLDER_GEN_SRC } from '@wyvr/generator/src/constants/folder.js';
import { parse_tag } from '@wyvr/generator/src/utils/shortcode.js';
import { Cwd } from '@wyvr/generator/src/vars/cwd.js';

export async function replace_content(content, store_id) {
    if (!content) {
        return '';
    }
    const stores = Config.get('shop.stores');
    const store_key = Object.keys(stores).find((key) => stores[key] === store_id);

    // modifications to avoid svelte compile errors
    // @TODO the curly braces causes massive errros in svelte
    let replaced_content = content
        .replace(/\{\}/g, '')
        .replace(/\{\\&quot;/g, "('")
        .replace(/\\&quot;\}/g, "')")
        .replace(/\\&quot;/g, "'");

    replaced_content = await async_replace(replaced_content, /\{\{([^\}]+)\}\}/g, async (_, inner) => {
        const tag_data = parse_tag(inner);
        if (!tag_data) {
            return '';
        }
        const data = tag_data.attributes;
        switch (tag_data.tag) {
            case 'store':
                if (data.url !== undefined) {
                    return `/${store_key}/${data.url}`;
                }
                break;
            case 'widget': {
                let path = 'magento2/widget/Default';
                const possible_templates = [path];
                let props = data;
                const type_path_parts = (data.type || '')
                    .split('\\')
                    .reverse()
                    .map((value, index) => {
                        if (index === 0) {
                            return value;
                        }
                        return value.toLowerCase();
                    })
                    .reverse()
                    .join('/');
                const type_path = `magento2/widget/${type_path_parts}`;
                if (exists(Cwd.get(FOLDER_GEN_SRC, `${type_path}.svelte`))) {
                    path = type_path;
                }

                if (data.block_id !== undefined) {
                    const block = await get_block_by_id(store_id, data.block_id);
                    const block_tag = block.identifier.replace(/^(\w)/, (_, char) => char.toUpperCase()).replace(/-+(\w)/g, (_, char) => char.toUpperCase());
                    const block_path = `magento2/widget/${block_tag}`;
                    possible_templates.push(block_path);
                    if (exists(Cwd.get(FOLDER_GEN_SRC, `${block_path}.svelte`))) {
                        path = block_path;
                    }
                    props = block;
                } else if (data.template) {
                    const new_template = `magento2/widget/${data.template
                        .replace(/\.(?:phtml|php|html)$/, '')
                        .replace(/^widget\//, '')
                        .replace(/^[^:]+::/, '')}`;
                    possible_templates.push(new_template);
                    data.template = `${new_template}.svelte`;
                    if (exists(Cwd.get(FOLDER_GEN_SRC, data.template))) {
                        path = new_template;
                    }
                }
                // add a bit more debug infos
                props.templates = possible_templates;
                return `((${path} ${Object.keys(props)
                    .map((key) => `${key}={${JSON.stringify(props[key])}}`)
                    .join(' ')} store_id={${JSON.stringify(store_id)}} store_key={${JSON.stringify(store_key)}}))`;
            }
            case 'config': {
                const value = await get(store_id, data.path, 'content');
                if (value !== undefined) {
                    return value;
                }
                logger.warning('replace content unknown config path', data.path, 'for store', store_key);
                return '';
            }
            case 'media':
                if (data.url) {
                    // magento sometimes add ".renditions" to the path, remove it because it is not needed to access the image and cause troubles in nginx because of the hidden folder
                    data.url = data.url.replace(/\.renditions\//, '');
                    return `(media(src:'${Config.get('shop.domain')}/media/${data.url}'))`;
                }
                logger.warning('replace content media', data);
                return '';
        }
        logger.warning('replace content', tag_data.tag, data, store_id, store_key);
        return '';
    });
    return replaced_content.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
export async function async_replace(str, regex, asyncFn) {
    const promises = [];
    str.replace(regex, (match, ...args) => {
        const promise = asyncFn(match, ...args);
        promises.push(promise);
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
}
