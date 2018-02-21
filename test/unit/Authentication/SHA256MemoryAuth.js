'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const sha256MemoryAuth = require('lib/Authentication/SHA256MemoryAuth');
const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const td = require('testdouble');

describe('SHA256MemoryAuth', () => {
    it('should throw an error if the username is not provided', () => {
        expect(() => sha256MemoryAuth()).to.throw();
    });

    it('should mix-in AuthPlugin', () => {
        expect(sha256MemoryAuth({ dbUser: 'foo' }).getPassword).to.be.a('function');
        expect(sha256MemoryAuth({ dbUser: 'foo' }).getUser).to.be.a('function');
        expect(sha256MemoryAuth({ dbUser: 'foo' }).run).to.be.a('function');
    });

    context('getInitialAuthData()', () => {
        it('should return `undefined`', () => {
            return expect(sha256MemoryAuth({ user: 'foo' }).getInitialAuthData()).to.be.undefined;
        });
    });

    context('getName()', () => {
        it('should return the name assigned to the plugin', () => {
            expect(sha256MemoryAuth({ user: 'foo' }).getName()).to.equal('SHA256_MEMORY');
        });
    });

    context('getNextAuthData()', () => {
        it('should throw an error if the nonce does not have 20 bytes', () => {
            expect(() => sha256MemoryAuth({ user: 'foo' }).getNextAuthData('bar')).to.throw();
            expect(() => sha256MemoryAuth({ user: 'foo' }).getNextAuthData('bar'.repeat(20))).to.throw();
        });

        it('should generate a valid payload without a password', () => {
            const sha256 = td.function();
            const xor = td.function();
            const fakeSHA256MemoryAuth = proxyquire('lib/Authentication/SHA256MemoryAuth', { './Util/crypto': { sha256, xor } });

            const nonce = 'n'.repeat(20);

            td.when(xor('quux', 'bar')).thenReturn('scramble');
            td.when(sha256('baz', nonce), { times: 1 }).thenReturn('quux');
            td.when(sha256('bar'), { times: 1 }).thenReturn('baz');
            td.when(sha256(''), { times: 2 }).thenReturn('bar');

            const authData = fakeSHA256MemoryAuth({ user: 'user' }).getNextAuthData(nonce);

            expect(authData.toString()).to.match(/\u0000user\u0000scramble*/);
        });

        it('should generate a valid payload with a password', () => {
            const sha256 = td.function();
            const xor = td.function();
            const fakeSHA256MemoryAuth = proxyquire('lib/Authentication/SHA256MemoryAuth', { './Util/crypto': { sha256, xor } });

            const password = 'foo';
            const nonce = 'n'.repeat(20);

            td.when(xor('quux', 'bar')).thenReturn('scramble');
            td.when(sha256('baz', nonce), { times: 1 }).thenReturn('quux');
            td.when(sha256('bar'), { times: 1 }).thenReturn('baz');
            td.when(sha256('foo'), { times: 2 }).thenReturn('bar');

            const authData = fakeSHA256MemoryAuth({ user: 'user', password }).getNextAuthData(nonce);

            expect(authData.toString()).to.match(/\u0000user\u0000scramble*/);
        });
    });
});
