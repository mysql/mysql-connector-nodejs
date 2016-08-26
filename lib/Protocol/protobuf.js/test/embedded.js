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
var client = new Protobuf(Schema);
var encoded, decoded, check;

describe('Embedded tests', function () {
    it('Can encode embedded messages', function () {
        decoded = { int32: 12345 };
        encoded = client.encode('Test3', { test: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode embedded messages', function () {
        check = client.decode('Test3', encoded);
        expect(check.test).to.exist;
        expect(check.test).to.deep.equal(decoded);
    });

    it('Can encode repeated embedded messages', function () {
        decoded = [{ int32: 12345 }, { uint32: 67890 }];
        encoded = client.encode('Test3', { tests: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode repeated embedded messages', function () {
        check = client.decode('Test3', encoded);
        expect(check.tests).to.exist;
        expect(check.tests).to.deep.equal(decoded);
    });
});
