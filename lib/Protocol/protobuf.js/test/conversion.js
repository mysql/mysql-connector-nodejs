/*
 * Copyright (c) 2015, 2016, Oracle and/or its affiliates. All rights reserved.
 *
 * MySQL Connector/Node.js is licensed under the terms of the GPLv2
 * <http://www.gnu.org/licenses/old-licenses/gpl-2.0.html>, like most
 * MySQL Connectors. There are special exceptions to the terms and
 * conditions of the GPLv2 as it is applied to this software, see the
 * FLOSS License Exception
 * <http://www.mysql.com/about/legal/licensing/foss-exception.html>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; version 2 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

/* global describe, it */
var Protobuf = require('../index');
var Schema = require('./schema');
var Chai = require('chai');
Chai.Assertion.includeStack = true;
var expect = Chai.expect;
var long = require('long');
var client = new Protobuf(Schema);
var encoded, decoded, check;

describe('Conversion tests', function () {
    it('Accepts strings in place of numbers', function () {
        decoded = '1234';
        encoded = client.encode('Test1', { int32: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Decodes numbers that were strings originally', function () {
        check = client.decode('Test1', encoded);
        expect(check.int32).to.exist;
        expect(check.int32).to.be.a('number');
        expect(check.int32).to.equal(Number(decoded));
    });

    it('Accepts numbers in place of strings', function () {
        decoded = 20;
        encoded = client.encode('Test1', { string: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Decodes strings that were numbers originally', function () {
        check = client.decode('Test1', encoded);
        expect(check.string).to.exist;
        expect(check.string).to.be.a('string');
        expect(check.string).to.equal(String(decoded));
    });

    it('Accepts numbers in place of longs', function () {
        decoded = 9876;
        encoded = client.encode('Test1', { int64: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Decodes longs that were numbers originally', function () {
        check = client.decode('Test1', encoded);
        expect(check.int64).to.exist;
        expect(check.int64).to.be.an.instanceof(long);
        expect(check.int64).to.deep.equal(long.fromNumber(decoded));
    });

    it('Accepts strings in place of longs', function () {
        decoded = '-1234';
        encoded = client.encode('Test1', { sint64: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Decodes longs that were strings originally', function () {
        check = client.decode('Test1', encoded);
        expect(check.sint64).to.exist;
        expect(check.sint64).to.be.an.instanceof(long);
        expect(check.sint64).to.deep.equal(long.fromString(decoded));
    });
});
