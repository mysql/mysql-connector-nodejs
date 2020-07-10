'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const wraps = require('../../../../../lib/Protocol/Wrappers/Traits/Wraps');

describe('Wraps trait', () => {
    context('valueOf()', () => {
        it('implements an identify function behavior', () => {
            let input = 'foo';
            expect(wraps(input).valueOf()).to.equal(input);

            input = { name: 'foo' };
            expect(wraps(input).valueOf()).to.equal(input);

            input = ['foo'];
            expect(wraps(input).valueOf()).to.equal(input);
        });
    });
});
