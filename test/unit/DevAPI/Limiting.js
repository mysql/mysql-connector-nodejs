'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const limiting = require('../../../lib/DevAPI/Limiting');
const td = require('testdouble');

describe('Limiting', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('limit()', () => {
        it('does not have default thresholds', () => {
            return expect(limiting().getCount()).to.not.exist;
        });

        it('sets limit `row_count` if one argument is provided', () => {
            return expect(limiting().limit(10).getCount()).to.equal(10);
        });

        it('forces an associated statement to be re-prepared the first time its called', () => {
            const forceReprepare = td.function();
            const query = limiting({ preparable: { forceReprepare } }).limit(1);

            expect(td.explain(forceReprepare).callCount).to.equal(1);

            query.limit(2);

            return expect(td.explain(forceReprepare).callCount).to.equal(1);
        });

        it('throws an error if the limit count is not valid', () => {
            expect(() => limiting().limit(-10)).to.throw('The count value must be a non-negative integer.');
        });

        context('when there is support for an offset', () => {
            it('forces a default value for the offset to streamline prepared statement support', () => {
                const query = limiting();
                query.offset = td.function();

                query.limit(2);

                expect(td.explain(query.offset).callCount).to.equal(1);
                return expect(td.explain(query.offset).calls[0].args[0]).to.equal(0);
            });

            // deprecated
            it('sets any provided value for the offset', () => {
                const query = limiting();
                query.offset = td.function();

                query.limit(2, 3);

                expect(td.explain(query.offset).callCount).to.equal(1);
                return expect(td.explain(query.offset).calls[0].args[0]).to.equal(3);
            });
        });
    });
});
