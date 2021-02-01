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
const plainAuth = require('../../../lib/Authentication/PlainAuth');

describe('PlainAuth', () => {
    it('mixes-in AuthPlugin', () => {
        expect(plainAuth({ dbUser: 'foo' }).getPassword).to.be.a('function');
        expect(plainAuth({ dbUser: 'foo' }).getSchema).to.be.a('function');
        expect(plainAuth({ dbUser: 'foo' }).getUser).to.be.a('function');
        expect(plainAuth({ dbUser: 'foo' }).run).to.be.a('function');
    });

    it('throws error if more authentation details are requested', () => {
        expect(() => plainAuth({ user: 'foo', password: 'bar' }).getNextAuthData('moar')).to.throw(/Unexpected/);
    });

    context('getName()', () => {
        it('returns the name assigned to the plugin', () => {
            expect(plainAuth({ user: 'foo' }).getName()).to.equal('PLAIN');
        });
    });

    context('getInitialAuthData()', () => {
        context('without a default schema', () => {
            it('is able to create an initial authentication payload without a password', () => {
                expect(plainAuth({ user: 'user' }).getInitialAuthData().toString()).to.equal('\0user\0');
            });

            it('generates the payload according to the spec', () => {
                expect(plainAuth({ password: 'foo', user: 'user' }).getInitialAuthData().toString()).to.equal('\0user\0foo');
            });
        });

        context('with a default schema', () => {
            it('is able to create an initial authentication payload without a password', () => {
                expect(plainAuth({ schema: 'schema', user: 'user' }).getInitialAuthData().toString()).to.equal('schema\0user\0');
            });

            it('generates the payload according to the spec', () => {
                expect(plainAuth({ password: 'foo', schema: 'schema', user: 'user' }).getInitialAuthData().toString()).to.equal('schema\0user\0foo');
            });
        });
    });
});
