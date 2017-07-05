'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const expect = require('chai').expect;
const parseExpressionInputs = require('lib/DevAPI/Util/parseExpressionInputs');

describe('Utils', () => {
    context('parseExpressionInputs', () => {
        it('should convert a list of SQL strings into an expression tree', () => {
            const expected = [{
                source: {
                    type: 1,
                    identifier: {
                        name: 'foo'
                    }
                },
                alias: 'fst'
            }, {
                source: {
                    type: 1,
                    identifier: {
                        name: 'bar'
                    }
                },
                alias: 'snd'
            }];

            expect(parseExpressionInputs(['foo as fst', 'bar as snd'])).to.deep.equal(expected);
        });

        it('should allow empty or undefined inputs', () => {
            ['', undefined, null].forEach(input => {
                return expect(parseExpressionInputs(input)).to.be.empty;
            });
        });
    });
});
