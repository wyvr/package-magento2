import { onExec } from '@src/magento2/core/media_fallback';

export default {
    url: '/media/[config]/[filepath]',
    _wyvr: () => {
        return {
            methods: ['get'],
        };
    },
    onExec,
};
