'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const parseFlexibleParamList = require('lib/DevAPI/Util/parseFlexibleParamList');

describe('parseFlexibleParamList', () => {
    it('should mirror an expression array', () => {
        expect(parseFlexibleParamList(['foo', 'bar'])).to.deep.equal(['foo', 'bar']);
    });

    it('should flatten an array of expression arrays', () => {
        expect(parseFlexibleParamList([['foo', 'bar'], ['baz', 'qux']])).to.deep.equal(['foo', 'bar', 'baz', 'qux']);
    });

    it('should throw an error if an expression is not valid', () => {
        expect(function () { parseFlexibleParamList([{ foo: 'bar' }]); }).to.throw(Error, 'invalid input expression');
    });
});