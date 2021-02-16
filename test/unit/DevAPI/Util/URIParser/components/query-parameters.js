/*
 * Copyright (c) 2020, 2021, Oracle and/or its affiliates.
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
const parseUri = require('../../../../../../lib/DevAPI/Util/URIParser');

describe('parsing query parameters', () => {
    context('checking the existence and value of ssl-mode', () => {
        it('uses "true" by default if the option is not provided', () => {
            let connectionString = 'user@hostname';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = 'user:password@hostname:33061';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = 'user:password@hostname:33061/';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = 'user:password@hostname:33061?foo=bar';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = 'user:password@hostname:33061/?foo=bar';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;
        });

        it('uses "true" by default if the option is unknown', () => {
            let connectionString = 'user@hostname?ssl-mode=foo';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = 'user:password@hostname:33061?ssl-mode=foo';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = 'user:password@hostname:33061/?ssl-mode=foo';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = 'user:password@hostname:33061?foo=bar&ssl-mode=foo';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = 'user:password@hostname:33061/?foo=bar&ssl-mode=foo';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            return expect(parseUri(connectionString).tls.enabled).to.be.true;
        });

        it('uses "true" if the option value is "REQUIRED"', () => {
            let connectionString = 'user@hostname?ssl-mode=REQUIRED';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = 'user:password@hostname:33061?ssl-mode=REQUIRED';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = 'user:password@hostname:33061/?ssl-mode=REQUIRED';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = 'user:password@hostname:33061?foo=bar&ssl-mode=REQUIRED';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = 'user:password@hostname:33061/?foo=bar&ssl-mode=REQUIRED';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = 'user:password@hostname:33061?foo=bar&ssl-mode=REQUIRED&baz=qux';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = 'user:password@hostname:33061/?foo=bar&ssl-mode=REQUIRED&baz=qux';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = 'user:password@hostname:33061/foo?bar=baz&ssl-mode=REQUIRED&qux=quux';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;
        });

        it('uses "false" if the option value is "DISABLED"', () => {
            let connectionString = 'user@hostname?ssl-mode=DISABLED';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = 'user:password@hostname:33061?ssl-mode=DISABLED';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = 'user:password@hostname:33061/?ssl-mode=DISABLED';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = 'user:password@hostname:33061?foo=bar&ssl-mode=DISABLED';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = 'user:password@hostname:33061/?foo=bar&ssl-mode=DISABLED';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = 'user:password@hostname:33061?foo=bar&ssl-mode=DISABLED&baz=qux';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = 'user:password@hostname:33061/?foo=bar&ssl-mode=DISABLED&baz=qux';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = 'user:password@hostname:33061/foo?bar=baz&ssl-mode=DISABLED&qux=quux';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            return expect(parseUri(connectionString).tls.enabled).to.be.false;
        });
    });

    context('checking the name of the authentication mechanism', () => {
        it('uses the upper-case version of authentication mechanism name', () => {
            let connectionString = 'user@hostname?auth=foo';
            expect(parseUri(connectionString).auth).to.equal('FOO');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).auth).to.equal('FOO');

            connectionString = 'user@hostname/schema?auth=foo';
            expect(parseUri(connectionString).auth).to.equal('FOO');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).auth).to.equal('FOO');

            connectionString = 'user@hostname?foo=bar&auth=baz';
            expect(parseUri(connectionString).auth).to.equal('BAZ');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).auth).to.equal('BAZ');

            connectionString = 'user@hostname/schema?foo=bar&auth=baz';
            expect(parseUri(connectionString).auth).to.equal('BAZ');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).auth).to.equal('BAZ');
        });
    });

    context('checking the value for the connection timeout', () => {
        it('uses any existing value for the connection timeout', () => {
            let connectionString = 'user@hostname?connect-timeout=foo';
            expect(parseUri(connectionString).connectTimeout).to.equal('foo');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).connectTimeout).to.equal('foo');

            connectionString = 'user@hostname/schema?connect-timeout=foo';
            expect(parseUri(connectionString).connectTimeout).to.equal('foo');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).connectTimeout).to.equal('foo');

            connectionString = 'user@hostname?foo=bar&connect-timeout=foo';
            expect(parseUri(connectionString).connectTimeout).to.equal('foo');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).connectTimeout).to.equal('foo');

            connectionString = 'user@hostname/schema?foo=bar&connect-timeout=foo';
            expect(parseUri(connectionString).connectTimeout).to.equal('foo');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).connectTimeout).to.equal('foo');
        });
    });
});
