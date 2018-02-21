'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const mysql41Auth = require('lib/Authentication/MySQL41Auth');
const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const td = require('testdouble');

describe('MySQL41Auth', () => {
    it('should throw an error if the username is not provided', () => {
        expect(() => mysql41Auth()).to.throw();
    });

    it('should mix-in AuthPlugin', () => {
        expect(mysql41Auth({ dbUser: 'foo' }).getPassword).to.be.a('function');
        expect(mysql41Auth({ dbUser: 'foo' }).getUser).to.be.a('function');
        expect(mysql41Auth({ dbUser: 'foo' }).run).to.be.a('function');
    });

    context('getInitialAuthData()', () => {
        it('should return `undefined`', () => {
            return expect(mysql41Auth({ user: 'foo' }).getInitialAuthData()).to.be.undefined;
        });
    });

    context('getName()', () => {
        it('should return the name assigned to the plugin', () => {
            expect(mysql41Auth({ user: 'foo' }).getName()).to.equal('MYSQL41');
        });
    });

    context('getNextAuthData()', () => {
        it('should throw an error if the nonce does not have 20 bytes', () => {
            expect(() => mysql41Auth({ user: 'foo' }).getNextAuthData('bar')).to.throw();
            expect(() => mysql41Auth({ user: 'foo' }).getNextAuthData('bar'.repeat(20))).to.throw();
        });

        it('should generate a valid payload without a password', () => {
            const authData = mysql41Auth({ user: 'user' }).getNextAuthData('n'.repeat(20));

            expect(authData.toString()).to.match(/\u0000user\u0000\**/);
        });

        it('should generate a valid payload with a password', () => {
            const sha1 = td.function();
            const xor = td.function();
            const fakeMySQL41Auth = proxyquire('lib/Authentication/MySQL41Auth', { './Util/crypto': { sha1, xor } });

            const password = 'foo';
            const nonce = 'n'.repeat(20);

            td.when(xor('bar', 'quux')).thenReturn('scramble');
            td.when(sha1(nonce, 'baz'), { times: 1 }).thenReturn('quux');
            td.when(sha1('bar'), { times: 1 }).thenReturn('baz');
            td.when(sha1('foo'), { times: 2 }).thenReturn('bar');

            const authData = fakeMySQL41Auth({ user: 'user', password }).getNextAuthData(nonce);

            expect(authData.toString()).to.match(/\u0000user\u0000\*scramble*/);
        });
    });
});
