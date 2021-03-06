/*
 * Copyright (c) 2018, 2021, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is also distributed with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms,
 * as designated in a particular file or component or in included license
 * documentation.  The authors of MySQL hereby grant you an
 * additional permission to link the program and your derivative works
 * with the separately licensed software that they have included with
 * MySQL.
 *
 * Without limiting anything contained in the foregoing, this file,
 * which is part of MySQL Connector/Node.js, is also subject to the
 * Universal FOSS Exception, version 1.0, a copy of which can be found at
 * http://oss.oracle.com/licenses/universal-foss-exception.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License, version 2.0, for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301  USA
 */

'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const sha256MemoryAuth = require('../../../lib/Authentication/SHA256MemoryAuth');
const td = require('testdouble');

describe('SHA256MemoryAuth', () => {
    it('throws an error if the username is not provided', () => {
        expect(() => sha256MemoryAuth()).to.throw();
    });

    it('mixes-in AuthPlugin', () => {
        expect(sha256MemoryAuth({ user: 'foo' }).getPassword).to.be.a('function');
        expect(sha256MemoryAuth({ user: 'foo' }).getSchema).to.be.a('function');
        expect(sha256MemoryAuth({ user: 'foo' }).getUser).to.be.a('function');
        expect(sha256MemoryAuth({ user: 'foo' }).run).to.be.a('function');
    });

    context('getInitialAuthData()', () => {
        it('returns `undefined`', () => {
            return expect(sha256MemoryAuth({ user: 'foo' }).getInitialAuthData()).to.be.undefined;
        });
    });

    context('getName()', () => {
        it('returns the name assigned to the plugin', () => {
            expect(sha256MemoryAuth({ user: 'foo' }).getName()).to.equal('SHA256_MEMORY');
        });
    });

    context('getNextAuthData()', () => {
        it('throws an error if the nonce does not have 20 bytes', () => {
            expect(() => sha256MemoryAuth({ user: 'foo' }).getNextAuthData('bar')).to.throw();
            expect(() => sha256MemoryAuth({ user: 'foo' }).getNextAuthData('bar'.repeat(20))).to.throw();
        });

        context('valid handshake', () => {
            let fakeSHA256MemoryAuth, nonce, passwordHash, passwordHashHash, hashWithNonce, scramble, sha256, xor;

            afterEach('reset fakes', () => {
                td.reset();
            });

            beforeEach('create fakes', () => {
                sha256 = td.function();
                xor = td.function();

                td.replace('../../../lib/Authentication/Util/crypto', { sha256, xor });

                fakeSHA256MemoryAuth = require('../../../lib/Authentication/SHA256MemoryAuth');

                scramble = 'scramble';
                nonce = 'n'.repeat(20);

                td.when(xor(hashWithNonce, passwordHash)).thenReturn(scramble);
                td.when(sha256(passwordHashHash, nonce), { times: 1 }).thenReturn(hashWithNonce);
                td.when(sha256(passwordHash), { times: 1 }).thenReturn(passwordHashHash);
            });

            context('without a default schema', () => {
                it('generates a valid payload without a password', () => {
                    td.when(sha256(''), { times: 2 }).thenReturn(passwordHash);

                    const authData = fakeSHA256MemoryAuth({ user: 'user' }).getNextAuthData(nonce);

                    // eslint-disable-next-line no-control-regex
                    expect(authData.toString()).to.match(/\u0000user\u0000scramble*/);
                });

                it('generates a valid payload with a password', () => {
                    const password = 'foo';

                    td.when(sha256(password), { times: 2 }).thenReturn(passwordHash);

                    const authData = fakeSHA256MemoryAuth({ user: 'user', password }).getNextAuthData(nonce);

                    // eslint-disable-next-line no-control-regex
                    expect(authData.toString()).to.match(/\u0000user\u0000scramble*/);
                });
            });

            context('with a default schema', () => {
                it('generates a valid payload without a password', () => {
                    td.when(sha256(''), { times: 2 }).thenReturn(passwordHash);

                    const authData = fakeSHA256MemoryAuth({ schema: 'schema', user: 'user' }).getNextAuthData(nonce);

                    // eslint-disable-next-line no-control-regex
                    expect(authData.toString()).to.match(/schema\u0000user\u0000scramble*/);
                });

                it('generates a valid payload with a password', () => {
                    const password = 'foo';

                    td.when(sha256(password), { times: 2 }).thenReturn(passwordHash);

                    const authData = fakeSHA256MemoryAuth({ schema: 'schema', user: 'user', password }).getNextAuthData(nonce);

                    // eslint-disable-next-line no-control-regex
                    expect(authData.toString()).to.match(/schema\u0000user\u0000scramble*/);
                });
            });
        });
    });
});
