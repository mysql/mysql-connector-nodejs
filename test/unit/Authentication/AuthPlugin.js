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

const authPlugin = require('../../../lib/Authentication/AuthPlugin');
const expect = require('chai').expect;
const td = require('testdouble');

describe('authPlugin', () => {
    context('getPassword()', () => {
        it('returns an empty string if no schema is provided', () => {
            expect(authPlugin({}).getPassword()).to.equal('');
        });

        it('returns the name of the provided password', () => {
            expect(authPlugin({ dbPassword: 'foo' }).getPassword()).to.equal('foo');
            expect(authPlugin({ password: 'foo' }).getPassword()).to.equal('foo');
        });
    });

    context('getSchema()', () => {
        it('returns an empty string if no schema is provided', () => {
            expect(authPlugin({}).getSchema()).to.equal('');
        });

        it('returns the name of the provided schema', () => {
            expect(authPlugin({ schema: 'foo' }).getSchema()).to.equal('foo');
        });
    });

    context('getUser()', () => {
        it('returns undefined if no user is provided', () => {
            expect(authPlugin({}).getUser()).to.equal(undefined);
        });

        it('returns the name of the provided user', () => {
            expect(authPlugin({ dbUser: 'foo' }).getUser()).to.equal('foo');
            expect(authPlugin({ user: 'foo' }).getUser()).to.equal('foo');
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

        it('calls the authenticate() method of the given client with the given context', () => {
            const plugin = authPlugin({ password: 'foo', schema: 'bar', user: 'baz' });

            td.when(authenticate(plugin), { ignoreExtraArgs: true }).thenReturn('qux');
            expect(plugin.run({ authenticate })).to.equal('qux');
        });
    });
});
