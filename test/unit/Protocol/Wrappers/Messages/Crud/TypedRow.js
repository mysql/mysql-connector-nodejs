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

// subject under test needs to be reloaded with replacement test doubles
let TypedRow = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/TypedRow');

describe('Mysqlx.Crud.Insert.TypedRow wrapper', () => {
    let CrudStub;

    beforeEach('replace dependencies with test doubles', () => {
        CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
        // reload module with the replacements
        TypedRow = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/TypedRow');
    });

    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            let Expr, Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                Expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                TypedRow = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/TypedRow');
            });

            it('creates Mysqlx.Crud.Insert.TypedRow wrapper for a single value (e.g. a documentOrJSON definition)', () => {
                const documentOrJSON = { value: 'foo' };
                const valueExprProto = `${documentOrJSON}_proto`;
                const proto = new CrudStub.Insert.TypedRow();
                const protoValue = 'bar';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });
                td.when(Expr.create({ value: documentOrJSON.value })).thenReturn({ valueOf: () => valueExprProto });

                expect(TypedRow.create(documentOrJSON).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setFieldList).callCount).to.equal(1);
                expect(td.explain(proto.setFieldList).calls[0].args[0]).to.deep.equal([valueExprProto]);
            });

            it('creates a Mysqlx.Crud.Insert.TypedRow wrapper for a an array of values (e.g. the column values of a table row)', () => {
                // ensure undefined values are ignored
                const columnValues = [{ value: 'foo' }, {}, { value: 'bar' }];
                const valueExprProtos = columnValues.filter(({ value }) => typeof value !== 'undefined').map(({ value }) => `${value}_proto`);
                const proto = new CrudStub.Insert.TypedRow();
                const protoValue = 'baz';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });
                td.when(Expr.create({ ...columnValues[0] })).thenReturn({ valueOf: () => valueExprProtos[0] });
                td.when(Expr.create({ ...columnValues[2] })).thenReturn({ valueOf: () => valueExprProtos[1] });

                expect(TypedRow.create(columnValues).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setFieldList).callCount).to.equal(1);
                expect(td.explain(proto.setFieldList).calls[0].args[0]).to.deep.equal(valueExprProtos);
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            let Expr;

            beforeEach('replace dependencies with test doubles', () => {
                Expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
                // reload module with the replacements
                TypedRow = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/TypedRow');
            });

            it('returns a textual representation of a Mysqlx.Crud.Insert.TypedRow message', () => {
                const field = ['foo', 'bar'];
                const fieldListProto = field.map(f => `${f}_proto`);
                const proto = new CrudStub.Insert.TypedRow();

                td.when(proto.getFieldList()).thenReturn(fieldListProto);
                td.when(Expr(fieldListProto[0])).thenReturn({ toJSON: () => field[0] });
                td.when(Expr(fieldListProto[1])).thenReturn({ toJSON: () => field[1] });

                expect(TypedRow(proto).toJSON()).to.deep.equal({ field });
            });
        });

        context('valueOf()', () => {
            let Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                TypedRow = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/TypedRow');
            });

            it('returns the underlying protobuf stub instance', () => {
                const proto = new CrudStub.Insert.TypedRow();
                const expected = 'foo';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => expected });

                expect(TypedRow(proto).valueOf()).to.equal(expected);
            });
        });
    });
});
