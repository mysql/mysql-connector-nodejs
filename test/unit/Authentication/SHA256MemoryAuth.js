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
        expect(sha256MemoryAuth({ user: 'foo' }).getPassword).to.be.a('function');
        expect(sha256MemoryAuth({ user: 'foo' }).getSchema).to.be.a('function');
        expect(sha256MemoryAuth({ user: 'foo' }).getUser).to.be.a('function');
        expect(sha256MemoryAuth({ user: 'foo' }).run).to.be.a('function');
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

        context('valid handshake', () => {
            let fakeSHA256MemoryAuth, nonce, passwordHash, passwordHashHash, hashWithNonce, scramble, sha256, xor;

            beforeEach('create fakes', () => {
                sha256 = td.function();
                xor = td.function();

                fakeSHA256MemoryAuth = proxyquire('lib/Authentication/SHA256MemoryAuth', { './Util/crypto': { sha256, xor } });

                scramble = 'scramble';
                nonce = 'n'.repeat(20);

                td.when(xor(hashWithNonce, passwordHash)).thenReturn(scramble);
                td.when(sha256(passwordHashHash, nonce), { times: 1 }).thenReturn(hashWithNonce);
                td.when(sha256(passwordHash), { times: 1 }).thenReturn(passwordHashHash);
            });

            context('without a default schema', () => {
                it('should generate a valid payload without a password', () => {
                    td.when(sha256(''), { times: 2 }).thenReturn(passwordHash);

                    const authData = fakeSHA256MemoryAuth({ user: 'user' }).getNextAuthData(nonce);

                    /* eslint-disable no-control-regex */
                    expect(authData.toString()).to.match(/\u0000user\u0000scramble*/);
                    /* eslint-enables no-control-regex */
                });

                it('should generate a valid payload with a password', () => {
                    const password = 'foo';

                    td.when(sha256(password), { times: 2 }).thenReturn(passwordHash);

                    const authData = fakeSHA256MemoryAuth({ user: 'user', password }).getNextAuthData(nonce);

                    /* eslint-disable no-control-regex */
                    expect(authData.toString()).to.match(/\u0000user\u0000scramble*/);
                    /* eslint-enable no-control-regex */
                });
            });

            context('with a default schema', () => {
                it('should generate a valid payload without a password', () => {
                    td.when(sha256(''), { times: 2 }).thenReturn(passwordHash);

                    const authData = fakeSHA256MemoryAuth({ schema: 'schema', user: 'user' }).getNextAuthData(nonce);

                    /* eslint-disable no-control-regex */
                    expect(authData.toString()).to.match(/schema\u0000user\u0000scramble*/);
                    /* eslint-enables no-control-regex */
                });

                it('should generate a valid payload with a password', () => {
                    const password = 'foo';

                    td.when(sha256(password), { times: 2 }).thenReturn(passwordHash);

                    const authData = fakeSHA256MemoryAuth({ schema: 'schema', user: 'user', password }).getNextAuthData(nonce);

                    /* eslint-disable no-control-regex */
                    expect(authData.toString()).to.match(/schema\u0000user\u0000scramble*/);
                    /* eslint-enable no-control-regex */
                });
            });
        });
    });
});
