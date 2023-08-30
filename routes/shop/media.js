import { onExec } from '@src/shop/core/media_fallback';

export default {
    url: '/media/[config]/[filepath]',
    _wyvr: () => {
        return {
            methods: ['get'],
        };
    },
    onExec,
};
