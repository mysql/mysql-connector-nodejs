'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const limiting = require('lib/DevAPI/Limiting');
const expect = require('chai').expect;

describe('limiting', () => {
    context('limit()', () => {
        it('should do nothing if no argument is provided', () => {
            return expect(limiting().getLimit()).to.be.undefined;
        });

        it('should set limit `row_count` if one argument is provided', () => {
            const query = limiting().limit(10);

            return expect(query.getLimit()).to.deep.equal({ row_count: 10, offset: undefined });
        });

        it('should set limit `row_count` and `offset` properties', () => {
            const query = limiting().limit(10, 0);

            return expect(query.getLimit()).to.deep.equal({ row_count: 10, offset: 0 });
        });

        it('should throw an error if the limit count is not valid', () => {
            expect(() => limiting().limit(-10)).to.throw('count must be a non-negative integer');
        });

        it('should throw an error if the limit offset is not valid', () => {
            return expect(() => limiting().limit(10, -10)).to.throw('offset must be a non-negative integer');
        });
    });
});
