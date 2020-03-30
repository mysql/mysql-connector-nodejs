'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

describe('columnWrapper', () => {
    let columnWrapper, wrap;

    beforeEach('create fakes', () => {
        wrap = td.function();

        td.replace('../../../../lib/DevAPI/Column', wrap);

        columnWrapper = require('../../../../lib/DevAPI/Util/columnWrapper');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    it('returns nothing if the original callback is not a function', () => {
        return expect(columnWrapper('foo')).to.not.exist;
    });

    it('wraps the value returned by the callback function in a column instance', () => {
        const id = arg => arg;
        const fn = columnWrapper(id);

        td.when(wrap('foo')).thenReturn('baz');
        td.when(wrap('bar')).thenReturn('qux');

        return expect(fn(['foo', 'bar'])).to.deep.equal(['baz', 'qux']);
    });
});
