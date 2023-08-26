import { strictEqual, deepStrictEqual } from 'assert';
import { encode_conditions } from './encode_conditions.js';

describe('magento2/core/widget/encode_conditions', () => {
    it('undefined', async () => {
        strictEqual(encode_conditions(), undefined);
    });
    it('empty', async () => {
        strictEqual(encode_conditions(''), undefined);
    });
    it('nested object', async () => {
        deepStrictEqual(
            encode_conditions(
                '^[`a`:^[`b`:`c`^]^]'
            ),
            {
                a: {
                    b: 'c',
                }
            }
        );
    });
    it('convert to path', async () => {
        deepStrictEqual(
            encode_conditions(
                '^[`a`:^[`b`:`c||d||e`^]^]'
            ),
            {
                a: {
                    b: 'c/d/e',
                }
            }
        );
    });
    it('object in string', async () => {
        deepStrictEqual(
            encode_conditions(
                '^[`a`:^[`b`:`^[^]`^]^]'
            ),
            {
                a: {
                    b: '{}',
                }
            }
        );
    });
    it('array', async () => {
        deepStrictEqual(
            encode_conditions(
                '^[`a`:^[`b`:[`c`]^]^]'
            ),
            {
                a: {
                    b: ['c'],
                }
            }
        );
    });
    it('sample 1', async () => {
        deepStrictEqual(
            encode_conditions(
                '^[`1`:^[`type`:`Magento||CatalogWidget||Model||Rule||Condition||Combine`,`aggregator`:`all`,`value`:`1`,`new_child`:``^],`1--1`:^[`type`:`Magento||CatalogWidget||Model||Rule||Condition||Product`,`attribute`:`sale`,`operator`:`==`,`value`:`1`^]^]'
            ),
            {
                1: {
                    aggregator: 'all',
                    new_child: '',
                    type: 'Magento/CatalogWidget/Model/Rule/Condition/Combine',
                    value: '1',
                },
                '1--1': {
                    attribute: 'sale',
                    operator: '==',
                    type: 'Magento/CatalogWidget/Model/Rule/Condition/Product',
                    value: '1',
                },
            }
        );
    });
    it('sample 2', async () => {
        deepStrictEqual(
            encode_conditions(
                '^[`1`:^[`type`:`Magento||CatalogWidget||Model||Rule||Condition||Combine`,`aggregator`:`all`,`value`:`1`,`new_child`:``^],`1--1`:^[`type`:`Magento||CatalogWidget||Model||Rule||Condition||Product`,`attribute`:`gender`,`operator`:`^[^]`,`value`:[`84`]^]^]'
            ),
            {
                1: {
                    aggregator: 'all',
                    new_child: '',
                    type: 'Magento/CatalogWidget/Model/Rule/Condition/Combine',
                    value: '1',
                },
                '1--1': {
                    attribute: 'gender',
                    operator: '{}',
                    type: 'Magento/CatalogWidget/Model/Rule/Condition/Product',
                    value: ['84'],
                },
            }
        );
    });
    it('sample 3', async () => {
        deepStrictEqual(
            encode_conditions(
                '^[`1`:^[`type`:`Magento||CatalogWidget||Model||Rule||Condition||Combine`,`aggregator`:`all`,`value`:`1`,`new_child`:``^]^]'
            ),
            {
                1: {
                    aggregator: 'all',
                    new_child: '',
                    type: 'Magento/CatalogWidget/Model/Rule/Condition/Combine',
                    value: '1',
                }
            }
        );
    });
    it('sample 4', async () => {
        deepStrictEqual(
            encode_conditions(
                '^[`1`:^[`type`:`Magento||CatalogWidget||Model||Rule||Condition||Combine`,`aggregator`:`all`,`value`:`1`,`new_child`:``,`operator`:`^[^]`,`value`:[`84`]^]^]'
            ),
            {
                1: {
                    aggregator: 'all',
                    new_child: '',
                    type: 'Magento/CatalogWidget/Model/Rule/Condition/Combine',
                    value: '1',
                    operator: '{}',
                    value: ['84']
                }
            }
        );
    });
});
