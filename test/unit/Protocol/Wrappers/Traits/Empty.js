'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const empty = require('../../../../../lib/Protocol/Wrappers/Traits/Empty');

describe('Empty trait', () => {
    context('toJSON()', () => {
        it('always returns an empty plain JavaScript object', () => {
            /* eslint-disable no-unused-expressions */
            expect(empty().toJSON()).to.be.an('object').and.be.empty;
            expect(empty(null).toJSON()).to.be.an('object').and.be.empty;
            expect(empty('foo').toJSON()).to.be.an('object').and.be.empty;
            expect(empty({}).toJSON()).to.be.an('object').and.be.empty;
            expect(empty({ name: 'foo' }).toJSON()).to.be.an('object').and.be.empty;
            expect(empty([]).toJSON()).to.be.an('object').and.be.empty;
            expect(empty(['foo']).toJSON()).to.be.an('object').and.be.empty;
            /* eslint-enable no-unused-expressions */
        });
    });
});
