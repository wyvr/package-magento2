import { filled_object } from '@wyvr/generator/src/utils/validate.js';

export function DemoPage(config) {
    let pkg_config = '<em>No config available</em>';
    if (filled_object(config)) {
        pkg_config = `<ul>${Object.keys(config)
            .map((key) => {
                return `<li>${key}: ${JSON.stringify(config[key])}</li>`;
            })
            .join('')}</ul>`;
    }
    return {
        url: '/package/magento2',
        title: 'Magento 2 Core',
        content: `
            ${pkg_config}
            `
    };
}
