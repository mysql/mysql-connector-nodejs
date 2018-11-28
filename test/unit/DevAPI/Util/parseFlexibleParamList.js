'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const parseFlexibleParamList = require('lib/DevAPI/Util/parseFlexibleParamList');

describe('parseFlexibleParamList', () => {
    it('should mirror an expression array', () => {
        expect(parseFlexibleParamList(['foo', 42])).to.deep.equal(['foo', 42]);
    });

    it('should flatten an array of expression arrays', () => {
        expect(parseFlexibleParamList([['foo', 'bar'], [42, 'qux']])).to.deep.equal(['foo', 'bar', 42, 'qux']);
    });

    it('should throw an error if an expression is not valid', () => {
        expect(function () { parseFlexibleParamList([() => {}]); }).to.throw(Error, 'invalid input expression');
    });

    it('should allow falsy values', () => {
        expect(parseFlexibleParamList([0, false, null, undefined])).to.deep.equal([0, false, null, undefined]);
    });
});
