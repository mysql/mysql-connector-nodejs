'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const skipping = require('../../../lib/DevAPI/Skipping');
const td = require('testdouble');

describe('Skipping', () => {
    context('offset()', () => {
        it('sets the offset value', () => {
            expect(skipping().offset(10).getOffset()).to.equal(10);
        });

        it('forces an associated statement to be re-prepared the first time its called', () => {
            const forceReprepare = td.function();
            const query = skipping({ preparable: { forceReprepare } }).offset(1);

            expect(td.explain(forceReprepare).callCount).to.equal(1);

            query.offset(2);

            expect(td.explain(forceReprepare).callCount).to.equal(1);
        });

        it('throws an error if the value is not valid', () => {
            return expect(() => skipping().offset(-10)).to.throw('The offset value must be a non-negative integer.');
        });
    });

    context('limit()', () => {
        it('sets a default `offset` value if one argument is provided', () => {
            expect(skipping().limit(10).getOffset()).to.equal(0);
        });

        // deprecated
        it('sets limit `row_count` and `offset` properties', () => {
            const query = skipping().limit(10, 10);

            expect(query.getCount()).to.equal(10);
            expect(query.getOffset()).to.equal(10);
        });

        it('re-uses a previous offset when setting a new limit', () => {
            const query = skipping({ count: 1, offset: 1 }).limit(2);

            expect(query.getCount()).to.equal(2);
            expect(query.getOffset()).to.equal(1);
        });

        it('throws an error if the limit offset is not valid', () => {
            return expect(() => skipping().limit(10, -10)).to.throw('The offset value must be a non-negative integer.');
        });
    });
});
