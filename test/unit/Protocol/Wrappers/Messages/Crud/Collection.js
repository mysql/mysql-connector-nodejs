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

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with test doubles
let Collection = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Collection');

describe('Mysqlx.Crud.Collection wrapper', () => {
    let CrudStub;

    beforeEach('replace dependencies with test doubles', () => {
        CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
        // reload module with the replacements
        Collection = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Collection');
    });

    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            let wraps;

            beforeEach('replace dependencies with test doubles', () => {
                wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                Collection = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Collection');
            });

            it('creates a Mysqlx.Crud.Collection wrapper instance with a given table name and schema name', () => {
                const name = 'foo';
                const proto = new CrudStub.Collection();
                const protoValue = 'bar';
                const schemaName = 'baz';

                td.when(wraps(proto)).thenReturn({ valueOf: () => protoValue });

                expect(Collection.create({ name, schemaName }).valueOf()).to.deep.equal(protoValue);
                expect(td.explain(proto.setName).callCount).to.equal(1);
                expect(td.explain(proto.setName).calls[0].args[0]).to.equal(name);
                expect(td.explain(proto.setSchema).callCount).to.equal(1);
                expect(td.explain(proto.setSchema).calls[0].args[0]).to.equal(schemaName);
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Crud.Collection message', () => {
                const proto = new CrudStub.Collection();
                const expected = 'foo';

                td.when(proto.toObject()).thenReturn(expected);

                expect(Collection(proto).toJSON()).to.deep.equal(expected);
            });
        });

        context('valueOf()', () => {
            let wraps;

            beforeEach('replace dependencies with test doubles', () => {
                wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                Collection = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Collection');
            });

            it('returns the underlying protobuf stub instance', () => {
                const proto = new CrudStub.Collection();
                const expected = 'foo';

                td.when(wraps(proto)).thenReturn({ valueOf: () => expected });

                expect(Collection(proto).valueOf()).to.equal(expected);
            });
        });
    });
});
