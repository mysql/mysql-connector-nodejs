'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const BaseQuery = require('lib/DevAPI/BaseQuery');
const expect = require('chai').expect;

describe('BaseQuery', () => {
    context('limit()', () => {
        it('should do nothing if no argument is provided', () => {
            const query = (new BaseQuery()).limit();

            expect(query._limit).to.be.undefined;
        });

        it('should set limit `row_count` if one argument is provided', () => {
            const query = (new BaseQuery()).limit(10);

            expect(query._limit).to.deep.equal({ row_count: 10, offset: undefined });
        });

        it('should set limit `row_count` and `offset` properties', () => {
            const query = (new BaseQuery()).limit(10, 0);

            expect(query._limit).to.deep.equal({ row_count: 10, offset: 0 });
        });

        it('should throw an error if the limit count is not valid', () => {
            const query = new BaseQuery();

            expect(() => query.limit(-10)).to.throw('count must be a non-negative integer');
        });

        it('should throw an error if the limit offset is not valid', () => {
            const query = new BaseQuery();

            expect(() => query.limit(10, -10)).to.throw('offset must be a non-negative integer');
        });
    });
});
