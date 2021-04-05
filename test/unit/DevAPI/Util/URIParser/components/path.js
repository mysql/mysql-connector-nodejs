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

const errors = require('../../../../../../lib/constants/errors');
const expect = require('chai').expect;
const parseUri = require('../../../../../../lib/DevAPI/Util/URIParser');

describe('parsing the path', () => {
    it('uses an undefined schema when the path does not exist', () => {
        let connectionString = 'user@hostname';
        expect(parseUri(connectionString)).to.include.keys('schema');
        // eslint-disable-next-line no-unused-expressions
        expect(parseUri(connectionString).schema).to.not.exist;

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString)).to.include.keys('schema');
        return expect(parseUri(connectionString).schema).to.not.exist;
    });

    it('uses an undefined schema when the path is empty', () => {
        let connectionString = 'user@hostname/';
        expect(parseUri(connectionString)).to.include.keys('schema');
        // eslint-disable-next-line no-unused-expressions
        expect(parseUri(connectionString).schema).to.not.exist;

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString)).to.include.keys('schema');
        // eslint-disable-next-line no-unused-expressions
        expect(parseUri(connectionString).schema).to.not.exist;

        connectionString = 'user@127.0.0.1/';
        expect(parseUri(connectionString)).to.include.keys('schema');
        // eslint-disable-next-line no-unused-expressions
        expect(parseUri(connectionString).schema).to.not.exist;

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString)).to.include.keys('schema');
        // eslint-disable-next-line no-unused-expressions
        expect(parseUri(connectionString).schema).to.not.exist;

        connectionString = 'user@[a1:b2:c4:d4:e5:f6:a7:b8]/';
        expect(parseUri(connectionString)).to.include.keys('schema');
        // eslint-disable-next-line no-unused-expressions
        expect(parseUri(connectionString).schema).to.not.exist;

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString)).to.include.keys('schema');
        // eslint-disable-next-line no-unused-expressions
        expect(parseUri(connectionString).schema).to.not.exist;

        connectionString = 'user@(/path/to/socket.sock)/';
        expect(parseUri(connectionString)).to.include.keys('schema');
        // eslint-disable-next-line no-unused-expressions
        expect(parseUri(connectionString).schema).to.not.exist;

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString)).to.include.keys('schema');
        // eslint-disable-next-line no-unused-expressions
        expect(parseUri(connectionString).schema).to.not.exist;

        connectionString = `user@${encodeURIComponent('/path/to/socket.sock')}/`;
        expect(parseUri(connectionString)).to.include.keys('schema');
        // eslint-disable-next-line no-unused-expressions
        expect(parseUri(connectionString).schema).to.not.exist;

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString)).to.include.keys('schema');
        return expect(parseUri(connectionString).schema).to.not.exist;
    });

    it('fails if the path contains multiple segments', () => {
        let connectionString = 'user@hostname/foo/bar';
        expect(() => parseUri(connectionString)).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_STRING_SCHEMA_NAME);

        connectionString = `mysqlx://${connectionString}`;
        expect(() => parseUri(connectionString)).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_STRING_SCHEMA_NAME);
    });

    it('uses the first path segment as the schema name', () => {
        let connectionString = 'user@hostname/foo';
        expect(parseUri(connectionString).schema).to.equal('foo');

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString).schema).to.equal('foo');

        connectionString = `user@hostname/${encodeURIComponent('^')}`;
        expect(parseUri(connectionString).schema).to.equal('^');

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString).schema).to.equal('^');

        connectionString = 'user@127.0.0.1/foo';
        expect(parseUri(connectionString).schema).to.equal('foo');

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString).schema).to.equal('foo');

        connectionString = `user@127.0.0.1/${encodeURIComponent('^')}`;
        expect(parseUri(connectionString).schema).to.equal('^');

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString).schema).to.equal('^');

        connectionString = 'user@[a1:b2:c4:d4:e5:f6:a7:b8]/foo';
        expect(parseUri(connectionString).schema).to.equal('foo');

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString).schema).to.equal('foo');

        connectionString = `user@[a1:b2:c4:d4:e5:f6:a7:b8]/${encodeURIComponent('^')}`;
        expect(parseUri(connectionString).schema).to.equal('^');

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString).schema).to.equal('^');

        connectionString = 'user@(/path/to/socket.sock)/foo';
        expect(parseUri(connectionString).schema).to.equal('foo');

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString).schema).to.equal('foo');

        connectionString = `user@(/path/to/socket.sock)/${encodeURIComponent('^')}`;
        expect(parseUri(connectionString).schema).to.equal('^');

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString).schema).to.equal('^');

        connectionString = `user@${encodeURIComponent('/path/to/socket.sock')}/foo`;
        expect(parseUri(connectionString).schema).to.equal('foo');

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString).schema).to.equal('foo');

        connectionString = `user@${encodeURIComponent('/path/to/socket.sock')}/${encodeURIComponent('^')}`;
        expect(parseUri(connectionString).schema).to.equal('^');

        connectionString = `mysqlx://${connectionString}`;
        expect(parseUri(connectionString).schema).to.equal('^');
    });

    it('fails if the value is not valid', () => {
        let connectionString = 'user@hostname/^';
        expect(() => parseUri(connectionString)).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_STRING_SCHEMA_NAME);

        connectionString = `mysqlx://${connectionString}`;
        expect(() => parseUri(connectionString)).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_STRING_SCHEMA_NAME);
    });
});
