/*
 * Copyright (c) 2020, 2022, Oracle and/or its affiliates.
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

const StringStub = require('../../../../../../lib/Protocol/Stubs/mysqlx_datatypes_pb').Scalar.String;
const collations = require('../../../../../../lib/Protocol/collations.json');
const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let str = require('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/String');

describe('Mysqlx.Datatypes.Scalar.String wrapper', () => {
    let bytes;

    beforeEach('create fakes', () => {
        bytes = td.replace('../../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        str = require('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/String');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('getCharset()', () => {
        it('returns the charset of the underlying string', () => {
            // pick a random collection from the list [0...collations.length - 1]
            const collation = collations[Math.floor(Math.random() * collations.length)];
            const proto = new StringStub();
            proto.setCollation(collation.id);

            expect(str(proto).getCharset()).to.equal(collation.charset);
        });
    });

    context('getCollationId()', () => {
        it('returns the specified collation id', () => {
            // pick a random collection from the list [0...collations.length - 1]
            const collation = collations[Math.floor(Math.random() * collations.length)];
            const proto = new StringStub();
            proto.setCollation(collation.id);

            return expect(str(proto).getCollationId()).to.equal(collation.id);
        });

        it('returns undefined if the collation id is not valid', () => {
            return expect(str(new StringStub()).getCollationId()).to.not.exist;
        });
    });

    context('toJSON()', () => {
        it('returns a textual representation of a Mysqlx.Datatypes.Scalar.String stub instance', () => {
            const message = str(new StringStub());
            const getCollationId = td.replace(message, 'getCollationId');
            const toString = td.replace(message, 'toString');

            td.when(getCollationId()).thenReturn('foo');
            td.when(toString()).thenReturn('bar');

            expect(message.toJSON()).to.deep.equal({ collation: 'foo', value: 'bar' });
        });
    });

    context('toString()', () => {
        context('when the charset is binary', () => {
            it('returns the output of the byte wrapper toString method in the right encoding', () => {
                // binary collation is the first item in the list
                const collation = collations[0];
                const toString = td.function();
                const proto = new StringStub();
                proto.setValue('foo');
                proto.setCollation(collation.id);

                td.when(toString('base64')).thenReturn('bar');
                td.when(bytes('foo')).thenReturn({ toString });

                expect(str(proto).toString()).to.equal('bar');
            });
        });

        context('when the charset is not binary', () => {
            it('returns the output of the byte wrapper toString method in the right encoding', () => {
                // non-binary collations in the list start from the second item (min = 1)
                const collation = collations[Math.floor(Math.random() * (collations.length - 1) + 1)];
                const toString = td.function();
                const proto = new StringStub();
                proto.setValue('foo');
                proto.setCollation(collation.id);

                td.when(toString()).thenReturn('bar');
                td.when(bytes('foo')).thenReturn({ toString });

                expect(str(proto).toString()).to.equal('bar');
            });
        });
    });
});
