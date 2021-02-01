/*
 * Copyright (c) 2016, 2021, Oracle and/or its affiliates.
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
const mysql41Auth = require('../../../lib/Authentication/MySQL41Auth');
const td = require('testdouble');

describe('MySQL41Auth', () => {
    it('throws an error if the username is not provided', () => {
        expect(() => mysql41Auth()).to.throw();
    });

    it('mixes-in AuthPlugin', () => {
        expect(mysql41Auth({ user: 'foo' }).getPassword).to.be.a('function');
        expect(mysql41Auth({ user: 'foo' }).getSchema).to.be.a('function');
        expect(mysql41Auth({ user: 'foo' }).getUser).to.be.a('function');
        expect(mysql41Auth({ user: 'foo' }).run).to.be.a('function');
    });

    context('getInitialAuthData()', () => {
        it('returns `undefined`', () => {
            return expect(mysql41Auth({ user: 'foo' }).getInitialAuthData()).to.be.undefined;
        });
    });

    context('getName()', () => {
        it('returns the name assigned to the plugin', () => {
            expect(mysql41Auth({ user: 'foo' }).getName()).to.equal('MYSQL41');
        });
    });

    context('getNextAuthData()', () => {
        afterEach('reset fakes', () => {
            td.reset();
        });

        it('throws an error if the nonce does not have 20 bytes', () => {
            expect(() => mysql41Auth({ user: 'foo' }).getNextAuthData('bar')).to.throw();
            expect(() => mysql41Auth({ user: 'foo' }).getNextAuthData('bar'.repeat(20))).to.throw();
        });

        context('without a default schema', () => {
            it('generates a valid payload without a password', () => {
                const authData = mysql41Auth({ user: 'user' }).getNextAuthData('n'.repeat(20));

                // eslint-disable-next-line
                expect(authData.toString()).to.match(/\u0000user\u0000\**/);
            });

            it('generates a valid payload with a password', () => {
                const sha1 = td.function();
                const xor = td.function();

                td.replace('../../../lib/Authentication/Util/crypto', { sha1, xor });

                const fakeMySQL41Auth = require('../../../lib/Authentication/MySQL41Auth');

                const password = 'foo';
                const nonce = 'n'.repeat(20);

                td.when(xor('bar', 'quux')).thenReturn('scramble');
                td.when(sha1(nonce, 'baz'), { times: 1 }).thenReturn('quux');
                td.when(sha1('bar'), { times: 1 }).thenReturn('baz');
                td.when(sha1('foo'), { times: 2 }).thenReturn('bar');

                const authData = fakeMySQL41Auth({ password, user: 'user' }).getNextAuthData(nonce);

                // eslint-disable-next-line no-control-regex
                expect(authData.toString()).to.match(/\u0000user\u0000\*scramble*/);
            });
        });

        context('with a default schema', () => {
            it('generates a valid payload without a password', () => {
                const authData = mysql41Auth({ schema: 'schema', user: 'user' }).getNextAuthData('n'.repeat(20));

                // eslint-disable-next-line no-control-regex
                expect(authData.toString()).to.match(/schema\u0000user\u0000\**/);
            });

            it('generates a valid payload with a password', () => {
                const sha1 = td.function();
                const xor = td.function();

                td.replace('../../../lib/Authentication/Util/crypto', { sha1, xor });

                const fakeMySQL41Auth = require('../../../lib/Authentication/MySQL41Auth');

                const password = 'foo';
                const nonce = 'n'.repeat(20);

                td.when(xor('bar', 'quux')).thenReturn('scramble');
                td.when(sha1(nonce, 'baz'), { times: 1 }).thenReturn('quux');
                td.when(sha1('bar'), { times: 1 }).thenReturn('baz');
                td.when(sha1('foo'), { times: 2 }).thenReturn('bar');

                const authData = fakeMySQL41Auth({ password, schema: 'schema', user: 'user' }).getNextAuthData(nonce);

                // eslint-disable-next-line no-control-regex
                expect(authData.toString()).to.match(/schema\u0000user\u0000\*scramble*/);
            });
        });
    });
});
