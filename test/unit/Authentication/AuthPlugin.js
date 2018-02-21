'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const authPlugin = require('lib/Authentication/AuthPlugin');
const expect = require('chai').expect;
const td = require('testdouble');

describe('authPlugin', () => {
    context('getUser()', () => {
        it('should return the name of the provided user', () => {
            expect(authPlugin({ dbUser: 'foo' }).getUser()).to.equal('foo');
            expect(authPlugin({ user: 'foo' }).getUser()).to.equal('foo');
        });
    });

    context('getPassword()', () => {
        it('should return the name of the provided user', () => {
            expect(authPlugin({ dbPassword: 'foo' }).getPassword()).to.equal('foo');
            expect(authPlugin({ password: 'foo' }).getPassword()).to.equal('foo');
        });
    });

    context('run()', () => {
        let authenticate;

        beforeEach('create fakes', () => {
            authenticate = td.function();
        });

        afterEach('reset fakes', () => {
            td.reset();
        });

        it('should call the authenticate() method of the given client with the given context', () => {
            const plugin = authPlugin({ password: 'foo', user: 'bar' });

            td.when(authenticate(plugin), { ignoreExtraArgs: true }).thenReturn('baz');
            expect(plugin.run({ authenticate })).to.equal('baz');
        });
    });
});
