'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const limiting = require('lib/DevAPI/Limiting');
const expect = require('chai').expect;

describe('limiting', () => {
    context('limit()', () => {
        it('should not have default thresholds', () => {
            const query = limiting();

            /* eslint-disable no-unused-expressions */
            expect(query.getCount()).to.not.exist;
            expect(query.getOffset()).to.not.exist;
            /* eslint-enable no-unused-expressions */
        });

        it('should set limit `row_count` if one argument is provided', () => {
            const query = limiting().limit(10);

            expect(query.getCount()).to.deep.equal(10);
            /* eslint-disable no-unused-expressions */
            expect(query.getOffset()).to.not.exist;
            /* eslint-enable no-unused-expressions */
        });

        it('should set limit `row_count` and `offset` properties', () => {
            const query = limiting().limit(10, 10);

            expect(query.getCount()).to.deep.equal(10);
            expect(query.getOffset()).to.equal(10);
        });

        it('should throw an error if the limit count is not valid', () => {
            expect(() => limiting().limit(-10)).to.throw('The count value must be a non-negative integer.');
        });

        it('should throw an error if the limit offset is not valid', () => {
            return expect(() => limiting().limit(10, -10)).to.throw('The offset value must be a non-negative integer.');
        });
    });

    context('offset()', () => {
        it('should set limit `offset` property', () => {
            expect(limiting().offset(10).getOffset()).to.equal(10);
        });

        it('should throw an error if the value is not valid', () => {
            it('should throw an error if the limit offset is not valid', () => {
                return expect(() => limiting().offset(-10)).to.throw('The offset value must be a non-negative integer.');
            });
        });
    });
});
