'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

describe('dns adapter', () => {
    let dns, resolveSrv;

    beforeEach('create fakes', () => {
        resolveSrv = td.function();

        td.replace('dns', { resolveSrv });

        dns = require('../../../lib/Adapters/dns');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('resolveSrv()', () => {
        it('fails if an error is returned in the native API callback', () => {
            const error = new Error('foo');

            td.when(resolveSrv('bar')).thenCallback(error);

            return dns.resolveSrv('bar')
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });

        it('succeeds with the value returned on the native API callback', () => {
            const expected = { foo: 'bar' };

            td.when(resolveSrv('bar')).thenCallback(null, expected);

            return dns.resolveSrv('bar')
                .then(actual => expect(actual).to.deep.equal(expected));
        });
    });
});
