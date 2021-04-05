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
const parsePlainAddress = require('../../../../../lib/DevAPI/Util/URIParser/parsePlainAddress');

describe('parsePlainAddress', () => {
    it('parses a full valid IPv6 address', () => {
        expect(parsePlainAddress('[2001:0db8:85a3:0000:0000:8a2e:0370:7334]:33060')).to.deep.equal({ host: '2001:0db8:85a3:0000:0000:8a2e:0370:7334', port: 33060, socket: undefined });
    });

    it('parses an IPv6 address without a port', () => {
        expect(parsePlainAddress('[::]')).to.deep.equal({ host: '::', port: undefined, socket: undefined });
    });

    it('parses a full valid IPv4 address', () => {
        expect(parsePlainAddress('127.0.0.1:33060')).to.deep.equal({ host: '127.0.0.1', port: 33060, socket: undefined });
    });

    it('parses a valid IPv4 address without a port', () => {
        expect(parsePlainAddress('0.0.0.0')).to.deep.equal({ host: '0.0.0.0', port: undefined, socket: undefined });
    });

    it('parses a valid full common name address', () => {
        expect(parsePlainAddress('prod-01.example.com:33060')).to.deep.equal({ host: 'prod-01.example.com', port: 33060, socket: undefined });
    });

    it('parses a valid common name address without a port', () => {
        expect(parsePlainAddress('localhost')).to.deep.equal({ host: 'localhost', port: undefined, socket: undefined });
    });

    it('throws an error if the address is not valid', () => {
        ['prod 01.example.com', '[01:23:45:67:89:ab]'].forEach(invalid => {
            expect(() => parsePlainAddress(invalid)).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_CONNECTION_STRING_HOST);
        });
    });

    it('parses a valid pct-encoded local Unix socket file', () => {
        ['%2Fpath%2Fto%2Fsocket', '.%2Fpath%2Fto%2Fsocket', '..%2Fpath%2Fto%2Fsocket'].forEach(socket => {
            expect(parsePlainAddress(socket)).to.deep.equal({ host: undefined, port: undefined, socket: socket.replace(/%2F/g, '/') });
        });
    });

    it('parses a valid custom-encoded local Unix socket file', () => {
        ['(/path/to/socket)', '(./path/to/socket)', '(../path/to/socket)'].forEach(socket => {
            expect(parsePlainAddress(socket)).to.deep.equal({ host: undefined, port: undefined, socket: socket.replace(/[()]/g, '') });
        });
    });
});
