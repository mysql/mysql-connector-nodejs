'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const list = require('../../../../../lib/Protocol/Wrappers/Traits/List');
const td = require('testdouble');

describe('List trait', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('toJSON()', () => {
        it('returns undefined if the input value is an empty array', () => {
            return expect(list([]).toJSON()).to.not.exist;
        });

        it('returns undefined if the input value is not available', () => {
            return expect(list().toJSON()).to.not.exist;
        });

        it('calls toJSON() for each item and returns the list of results', () => {
            const expected = ['foo', 'bar', 'baz'];
            const toJSON = td.function();
            const protos = [{ toJSON }, { toJSON }, { toJSON }];

            td.when(toJSON()).thenReturn(expected[2]);
            td.when(toJSON(), { times: 2 }).thenReturn(expected[1]);
            td.when(toJSON(), { times: 1 }).thenReturn(expected[0]);

            return expect(list(protos).toJSON()).to.deep.equal(expected);
        });
    });
});
