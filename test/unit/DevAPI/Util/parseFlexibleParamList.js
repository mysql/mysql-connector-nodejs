'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const parseFlexibleParamList = require('../../../../lib/DevAPI/Util/parseFlexibleParamList');

describe('parseFlexibleParamList', () => {
    it('mirrors an expression array', () => {
        expect(parseFlexibleParamList(['foo', 42])).to.deep.equal(['foo', 42]);
    });

    it('flattens an array of expression arrays', () => {
        expect(parseFlexibleParamList([['foo', 'bar'], [42, 'qux']])).to.deep.equal(['foo', 'bar', 42, 'qux']);
    });

    it('throws an error if an expression is not valid', () => {
        expect(function () { parseFlexibleParamList([() => {}]); }).to.throw(Error, 'invalid input expression');
    });

    it('allows falsy values', () => {
        expect(parseFlexibleParamList([0, false, null, undefined])).to.deep.equal([0, false, null, undefined]);
    });
});
