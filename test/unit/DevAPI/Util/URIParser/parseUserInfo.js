/*
 * Copyright (c) 2017, 2021, Oracle and/or its affiliates.
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

const errors = require('../../../../../lib/constants/errors');
const expect = require('chai').expect;
const parseUserInfo = require('../../../../../lib/DevAPI/Util/URIParser/parseUserInfo');

describe('parseUserInfo', () => {
    it('parses an userinfo segment containing both a username and a password', () => {
        ['foo:bar', 'foo:bar@'].forEach(userinfo => {
            expect(parseUserInfo('foo:bar')).to.deep.equal({ username: 'foo', password: 'bar' });
        });
    });

    it('parses a userinfo segment containing just the username', () => {
        expect(parseUserInfo('foo')).to.deep.equal({ username: 'foo', password: undefined });
    });

    it('parses a userinfo segment containing a password less user', () => {
        expect(parseUserInfo('foo:')).to.deep.equal({ username: 'foo', password: '' });
    });

    it('parses an userinfo segment with encoded usernames or passwords', () => {
        expect(parseUserInfo('foo%20bar:baz%20qux')).to.deep.equal({ username: 'foo bar', password: 'baz qux' });
    });

    it('parses an incomplete userinfo segment', () => {
        ['', '@', ':', ':bar'].forEach(password => {
            expect(parseUserInfo(password)).to.deep.equal({ username: undefined, password: undefined });
        });
    });

    it('throws an error if the username is not valid', () => {
        [
            'foo:bar:baz',
            'foo/bar:baz',
            'foo?bar:baz',
            'foo#bar:baz',
            'foo[bar:baz',
            'foo]bar:baz'
        ].forEach(userinfo => {
            expect(() => parseUserInfo(userinfo)).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_STRING_USER_INFO);
        });
    });

    it('throws an error if the password is not valid', () => {
        [
            'foo:bar/baz',
            'foo:bar?baz',
            'foo:bar#baz',
            'foo:bar[baz',
            'foo:bar]baz'
        ].forEach(userinfo => {
            expect(() => parseUserInfo(userinfo)).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_STRING_USER_INFO);
        });
    });
});
