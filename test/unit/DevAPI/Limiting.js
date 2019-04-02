'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const limiting = require('../../../lib/DevAPI/Limiting');
const td = require('testdouble');

describe('Limiting', () => {
    context('limit()', () => {
        it('does not have default thresholds', () => {
            const statement = limiting();

            /* eslint-disable no-unused-expressions */
            expect(statement.getCount()).to.not.exist;
            expect(statement.getOffset()).to.not.exist;
            /* eslint-enable no-unused-expressions */
        });

        it('sets limit `row_count` if one argument is provided', () => {
            const statement = limiting().limit(10);

            expect(statement.getCount()).to.equal(10);
        });

        context('when the operation allows an offset', () => {
            it('sets a default `offset` value if one argument is provided', () => {
                const statement = limiting({ allowsOffset: true }).limit(10);

                expect(statement.getOffset()).to.equal(0);
            });

            it('sets limit `row_count` and `offset` properties', () => {
                const statement = limiting({ allowsOffset: true }).limit(10, 10);

                expect(statement.getCount()).to.equal(10);
                expect(statement.getOffset()).to.equal(10);
            });

            it('throws an error if the limit offset is not valid', () => {
                return expect(() => limiting({ allowsOffset: true }).limit(10, -10)).to.throw('The offset value must be a non-negative integer.');
            });
        });

        context('when the operation does not allow an offset', () => {
            it('does not set a default `offset` value if one argument is provided', () => {
                const statement = limiting().limit(10);

                // eslint-disable-next-line no-unused-expressions
                expect(statement.getOffset()).to.not.exist;
            });

            it('re-uses a previous offset when setting a new limit', () => {
                const statement = limiting({ count: 1, offset: 1 }).limit(2);

                expect(statement.getCount()).to.equal(2);
                expect(statement.getOffset()).to.equal(1);
            });

            it('forces an associated statement to be re-prepared the first time its called', () => {
                const forceReprepare = td.function();
                const statement = limiting({ preparable: { forceReprepare } }).limit(1);

                expect(td.explain(forceReprepare).callCount).to.equal(1);

                statement.limit(2);

                expect(td.explain(forceReprepare).callCount).to.equal(1);
            });

            it('throws an error if the limit count is not valid', () => {
                expect(() => limiting().limit(-10)).to.throw('The count value must be a non-negative integer.');
            });
        });
    });

    context('offset()', () => {
        it('sets limit `offset` property', () => {
            expect(limiting().offset(10).getOffset()).to.equal(10);
        });

        it('forces an associated statement to be re-prepared the first time its called', () => {
            const forceReprepare = td.function();
            const statement = limiting({ preparable: { forceReprepare } }).limit(1);

            expect(td.explain(forceReprepare).callCount).to.equal(1);

            statement.offset(2);

            expect(td.explain(forceReprepare).callCount).to.equal(1);
        });

        it('throws an error if the value is not valid', () => {
            return expect(() => limiting().offset(-10)).to.throw('The offset value must be a non-negative integer.');
        });
    });
});
