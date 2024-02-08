import { onExec } from '@src/magento2/core/not_found_exec.js';
import { _wyvr } from '@src/magento2/core/not_found_wyvr.js';

export default {
    url: '/[store]/.*',
    onExec,
    _wyvr
};
