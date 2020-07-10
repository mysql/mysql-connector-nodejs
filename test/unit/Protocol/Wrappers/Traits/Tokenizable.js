'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let tokenizable = require('../../../../../lib/Protocol/Wrappers/Traits/Tokenizable');

describe('Tokenizable trait', () => {
    let bytes;

    beforeEach('create fakes', () => {
        bytes = td.replace('../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        tokenizable = require('../../../../../lib/Protocol/Wrappers/Traits/Tokenizable');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('toJSON()', () => {
        it('serializes the binary auth data into valid JSON using the bytes wrapper', () => {
            const toJSON = td.function();
            const getAuthData = td.function();
            const proto = { getAuthData };

            td.when(toJSON()).thenReturn('bar');
            td.when(bytes('foo')).thenReturn({ toJSON });
            td.when(getAuthData()).thenReturn('foo');

            expect(tokenizable(proto).toJSON()).to.deep.equal({ auth_data: 'bar' });
        });
    });

    context('toObject()', () => {
        it('returns the output of the toObject() method of the protobuf stub instance', () => {
            const toObject = td.function();
            const proto = { toObject };

            td.when(toObject()).thenReturn('foo');

            expect(tokenizable(proto).toObject()).to.equal('foo');
        });
    });
});
