'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const limiting = require('lib/DevAPI/Limiting');
const expect = require('chai').expect;

describe('limiting', () => {
    context('limit()', () => {
        it('should use default thresholds if no argument is provided', () => {
            const query = limiting();

            expect(query.getCount()).to.equal(Number.MAX_SAFE_INTEGER);
            expect(query.getOffset()).to.equal(0);
        });

        it('should set limit `row_count` if one argument is provided', () => {
            const query = limiting().limit(10);

            expect(query.getCount()).to.deep.equal(10);
            expect(query.getOffset()).to.equal(0);
        });

        it('should set limit `row_count` and `offset` properties', () => {
            const query = limiting().limit(10, 10);

            expect(query.getCount()).to.deep.equal(10);
            expect(query.getOffset()).to.equal(10);
        });

        it('should throw an error if the limit count is not valid', () => {
            expect(() => limiting().limit(-10)).to.throw('count must be a non-negative integer');
        });

        it('should throw an error if the limit offset is not valid', () => {
            return expect(() => limiting().limit(10, -10)).to.throw('offset must be a non-negative integer');
        });
    });
});
